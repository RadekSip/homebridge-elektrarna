import type { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';

import type { ElektrarnaHomebridgePlatform } from './platform.js';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ElektrarnaPlatformAccessory {
  private service: Service;

  constructor(
    private readonly platform: ElektrarnaHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HostMania.eu')
      .setCharacteristic(this.platform.Characteristic.Model, 'Elektrarna public API')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, '100001');

    // get the TemperatureSensor service if it exists, otherwise create a new TemperatureSensor service
    this.service = this.accessory.getService(this.platform.Service.TemperatureSensor) || this.accessory.addService(this.platform.Service.TemperatureSensor);

    // set the service name
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName);

    // register handlers for the CurrentTemperature Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .setProps({
        minValue: -1000, // Allow negative prices
        maxValue: 1000,  // Allow high prices
        minStep: 0.01,    // Allow 2 decimal places precision
      })
      .onGet(this.getCurrentPrice.bind(this));

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
    const apiUrl = this.platform.config.apiUrl || 'https://elektrarna.hostmania.eu/api/v1/currentprice/simple';

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const price = await response.text();
      const priceValue = parseFloat(price);

      if (isNaN(priceValue)) {
        throw new Error('Received price is not a number');
      }

      this.platform.log.debug('Get Characteristic CurrentPrice ->', priceValue);

      // Return the raw value
      return priceValue;
    } catch (error) {
      this.platform.log.error('Failed to fetch current price:', error);
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }
}
