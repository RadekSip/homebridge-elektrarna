<p align="center">

<img src="icon.png" width="150">

</p>

<span align="center">

# Elektrárna plugin pro Homebridge

</span>

_ENG: This plugin imports spot prices of electricity in the Czech Republic. I don't expect users from other countries, so the plugin is available only in Czech._

**Plugin _Elektrárna_ slouží k importu aktuální spotové ceny elektřiny do _Apple Home_.**
Díky znalosti aktuální ceny můžete automatizovat, ať už zapnout spotřebu nebo naopak vypnout zbytné a náročné spotřebiče.
Řada uživatelů automatizuje svou domácnost pomocí _Home Assistant_, ale v některých scénářích a pro některé _Apple Home_ příslušenství může být vhodné či nutné použít _Homebridge_.
Tento plugin Vám dává další možnost jak automatizovat.

Ceny se získávají z veřejného API projektu [Elektrárna](https://elektrarna.hostmania.eu), ve výchozím nastavení každou minutu. Ceny jsou v Kč/kWh bez DPH.

**_Apple Home_ má značná omezení oproti _Home Assistant_ a z toho vyplývají tyto tři nepříjemnosti:**
1. plugin _Elektrárna_ se do _Apple Home_ integruje jako teplotní čidlo (z dostupných možností pouze teplota umožňuje záporná čísla a zároveň má desetinná místa)
2. nelze odebrat symbol stupňů Celsia (_Apple HomeKit_ vůbec nepodporuje bezrozměrná čísla a doplňuje sám jednotky)
3. plugin dostává i předává hodnotu s dvěma desetinnými místy, ale ve výsledku to _Homebridge_ a následně i _Apple Home_ zaokrouhlují. Výsledky jsou zaokrouhlené po půl stupni, tj. 0,50Kč.
Vzniká tak nepřesnost +- 0,25Kč, se kterou je třeba při automatizaci počítat.


<span align="center">

**Vizte tento příklad:**

Aktuální spotová cena získaná pluginem je 3.14 Kč/kWh

V _Homebridge_ je zaokrouhlena na jedno místo: 3.1

V _Apple Home_ je vidět hodnota po půl stupních: 3.0

</span>

<p align="center">

<img src="/images/screenshot-homebridge1.png" width="150">

</p>

<p align="center">

<img src="/images/screenshot-homebridge2.png" width="500">

</p>

<p align="center">

<img src="/images/screenshot-settings.png" width="500">

</p>

<p align="center">

<img src="/images/screenshot-homekit1.png" width="500">

</p>

<p align="center">

<img src="/images/screenshot-homekit2.png" width="500">

</p>
