ractive = new Ractive({
	el: 'panels',
	template: '#meterVizTemplate',
	data: {
        // Percentage at which the battery goes to 'red' zone (export for Ractive templates)
        batteryRedThreshold: BATTERY_RED_THRESHOLD,
        // Percentage at which the battery enters 'yellow' zone (export for Ractive templates)
        batteryYellowThreshold: BATTERY_YELLOW_THRESHOLD,
        // The capacity of the battery, in percentage. Initially empty
        batteryPercent: NaN,
        // How much more time can the battery last?
        batteryLife: "",
        // True <=> the update daemon for the battery has been paused
        batteryPaused: false,
        // True <=> the update daemon for the battery has reported an error at its last try
        batteryUpdateError: false,
        // Is the battery connected to power?
        batteryCharging: false,
        batteryStateClass: function (state) {
            return state === 'discharging' ? BATTERY_RED_CLASS : BATTERY_GREEN_CLASS;
        },
        batteryLifeClass: function (percent) {
            return percent <= BATTERY_RED_THRESHOLD ? BATTERY_RED_CLASS : (percent <= BATTERY_YELLOW_THRESHOLD ? BATTERY_YELLOW_CLASS : BATTERY_GREEN_CLASS);
        }
	}
});

ractive.on({
    "battery-pause": function () {
        clearInterval(batteryUpdateTimerId);
        ractive.set('batteryPaused', true);
    },
    "battery-play": function () {
        updateBatteryStatus(); //Checks the status immediately, then starts the daemon
        batteryUpdateTimerId = setInterval(updateBatteryStatus, BATTERY_CHECK_INTERVAL);
        ractive.set('batteryPaused', false);
    }
});

function updateBatteryStatus() {
    $.getJSON(BATTERY_SERVICE_URL)
        .then(function (battery) {
        ractive.set('batteryUpdateError', false);
        var batteryLife = battery.timeToEmpty,
            batteryState = battery.state;
        ractive.animate('batteryPercent', parseInt(battery.percentage, 10), {
            easing: 'easeOut'
        });
        ractive.set('batteryLife', batteryLife);
        ractive.set('batteryState', batteryState);
        ractive.set('batteryCharging', batteryState !== BATTERY_STATE_DISCHARGING);

    }).fail(function () {
        ractive.set('batteryUpdateError', true);
    });
}

//Start the daemons that will check the battery and networks status...
batteryUpdateTimerId = setInterval(updateBatteryStatus, BATTERY_CHECK_INTERVAL);