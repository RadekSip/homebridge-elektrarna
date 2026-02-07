import type { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';

import type { ElektrarnaHomebridgePlatform } from './platform.js';

interface ElektrarnaResponse {
  hour: number;
  minute: number;
  priceEur: number;
  priceCzk: number;
  priceCzkVat: number;
  priceCzkKwh: number;
  exchRateCzkEur: number;
  priceLevel: string;
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ElektrarnaPlatformAccessory {
  private service: Service;
  private serviceLow: Service;
  private serviceMedium: Service;
  private serviceHigh: Service;

  constructor(
    private readonly platform: ElektrarnaHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HostMania.eu')
      .setCharacteristic(this.platform.Characteristic.Model, 'Elektrarna public API')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, '100001');

    // --- Temperature Sensor (Price) ---
    this.service = this.accessory.getService(this.platform.Service.TemperatureSensor) || this.accessory.addService(this.platform.Service.TemperatureSensor);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName);

    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .setProps({
        minValue: -1000,
        maxValue: 1000,
        minStep: 0.01,
      })
      .onGet(this.getCurrentPrice.bind(this));

    // --- Contact Sensor (Low Price) ---
    this.serviceLow = this.accessory.getServiceById(this.platform.Service.ContactSensor, 'low') 
      || this.accessory.addService(this.platform.Service.ContactSensor, 'Cena: Nízká', 'low');
    this.serviceLow.setCharacteristic(this.platform.Characteristic.Name, 'Cena: Nízká');

    // --- Contact Sensor (Medium Price) ---
    this.serviceMedium = this.accessory.getServiceById(this.platform.Service.ContactSensor, 'medium') 
      || this.accessory.addService(this.platform.Service.ContactSensor, 'Cena: Střední', 'medium');
    this.serviceMedium.setCharacteristic(this.platform.Characteristic.Name, 'Cena: Střední');

    // --- Contact Sensor (High Price) ---
    this.serviceHigh = this.accessory.getServiceById(this.platform.Service.ContactSensor, 'high') 
      || this.accessory.addService(this.platform.Service.ContactSensor, 'Cena: Vysoká', 'high');
    this.serviceHigh.setCharacteristic(this.platform.Characteristic.Name, 'Cena: Vysoká');


    // Calculate refresh interval (default 1 minute, minimum 1 minute)
    let intervalMinutes = this.platform.config.refreshInterval || 1;
    if (intervalMinutes < 1) {
      intervalMinutes = 1;
    }
    const intervalMs = intervalMinutes * 60 * 1000;

    this.platform.log.debug(`Setting refresh interval to ${intervalMinutes} minutes (${intervalMs} ms)`);

    // Update the price periodically
    setInterval(() => {
      this.getCurrentPrice()
        .then((price) => {
          this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, price);
        })
        .catch((error) => {
          this.platform.log.debug('Failed to update price in background:', error);
        });
    }, intervalMs);
  }

  /**
   * Handle the "GET" requests from HomeKit
   */
  async getCurrentPrice(): Promise<CharacteristicValue> {
    // Get URL from config, or use default if not set
    const apiUrl = this.platform.config.apiUrl || 'https://elektrarna-api.hostmania.eu/api/v1/currentprice';

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as ElektrarnaResponse;
      const priceValue = data.priceCzkKwh;

      if (typeof priceValue !== 'number' || isNaN(priceValue)) {
        throw new Error('Received price is not a number');
      }

      this.platform.log.debug('Get Characteristic CurrentPrice ->', priceValue);
      this.platform.log.debug('Current Price Level ->', data.priceLevel);

      // Update Level Sensors
      this.updateLevelSensors(data.priceLevel);

      // Return the raw value
      return priceValue;
    } catch (error) {
      this.platform.log.error('Failed to fetch current price:', error);
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  /**
   * Updates the 3 contact sensors based on the current level
   */
  updateLevelSensors(level: string) {
    // CONTACT_NOT_DETECTED = Open (Otevřeno) -> This is what we want when ACTIVE
    // CONTACT_DETECTED = Closed (Zavřeno) -> This is what we want when INACTIVE
    
    const activeState = this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
    const inactiveState = this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED;

    // Low
    this.serviceLow.updateCharacteristic(
      this.platform.Characteristic.ContactSensorState,
      level === 'low' ? activeState : inactiveState,
    );

    // Medium
    this.serviceMedium.updateCharacteristic(
      this.platform.Characteristic.ContactSensorState,
      level === 'medium' ? activeState : inactiveState,
    );

    // High
    this.serviceHigh.updateCharacteristic(
      this.platform.Characteristic.ContactSensorState,
      level === 'high' ? activeState : inactiveState,
    );
  }
}
