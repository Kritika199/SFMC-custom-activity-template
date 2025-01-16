define(['postmonger'], function (Postmonger) {
    'use strict';

    const connection = new Postmonger.Session();
    let authTokens = {};
    let payload = {};

    // Configuration variables
    let eventSchema = ''; // Used in parseEventSchema()
    let lastnameSchema = ''; // Used in parseEventSchema()
    let eventDefinitionKey = '';

    // Event listeners
    $(window).ready(onRender);
    connection.on('initActivity', initialize);
    connection.on('clickedNext', save); // Save function triggered in Marketing Cloud
    connection.on('requestedTriggerEventDefinition', handleTriggerEventDefinition);
    connection.on('requestedSchema', handleSchema);

    /**
     * Trigger the connection ready state when the window is loaded.
     */
    function onRender() {
        connection.trigger('ready');
        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
        connection.trigger('requestTriggerEventDefinition');
        connection.trigger('requestSchema');
    }

    /**
     * Handle the initialization of the activity when loaded in Journey Builder.
     * @param {Object} data - The data payload passed by Journey Builder.
     */
    function initialize(data) {
        if (data) {
            payload = data;
        }
        console.log('Initialized Payload:', payload);

        // Perform initial load actions
        initialLoad(data);

        // Parse event schema for customization
        parseEventSchema();
    }

    /**
     * Save function is fired when the user clicks "Done" in Marketing Cloud.
     * Updates the config.json with any modifications made in the UI.
     */
    function save() {
        payload['arguments'].execute.inArguments = [
            {
                SAMPLE_PARAM: "{{Contact.Attribute.Twilio_SMS_DE.TwilioNumber}}"
            }
        ];
        payload['metaData'].isConfigured = true;

        console.log('Saving Payload:', payload);

        connection.trigger('updateActivity', payload);
    }

    /**
     * Handle the Trigger Event Definition request response.
     * Extracts the event definition key.
     * @param {Object} eventDefinitionModel - The event definition model returned by Journey Builder.
     */
    function handleTriggerEventDefinition(eventDefinitionModel) {
        if (eventDefinitionModel && eventDefinitionModel.eventDefinitionKey) {
            eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
            console.log('Event Definition Key:', eventDefinitionKey);
        } else {
            console.warn('Event Definition Model is missing or invalid.');
        }
    }

    /**
     * Parse the event schema to extract necessary information for customization.
     * Extracts the schema and identifies the last name schema.
     */
    function parseEventSchema() {
        console.log('Requesting Schema...');
        connection.trigger('requestSchema');
    }

    /**
     * Handle the schema response and extract the required fields.
     * @param {Object} data - The schema data returned by Journey Builder.
     */
    function handleSchema(data) {
        if (!data || !data.schema) {
            console.error('Schema data is missing or invalid.');
            return;
        }

        const dataJson = data.schema;
        console.log('Schema Data:', dataJson);

        for (let i = 0; i < dataJson.length; i++) {
            // Find "lastname" in the schema and extract event schema
            if (dataJson[i].key.toLowerCase().replace(/ /g, '').includes('lastname')) {
                const splitArr = dataJson[i].key.split(".");
                lastnameSchema = splitArr[splitArr.length - 1];
                console.log('Last Name Schema:', lastnameSchema);

                const splitName = lastnameSchema.split(":");
                const reg = new RegExp(splitName[splitName.length - 1], "g");
                const oldSchema = splitArr[splitArr.length - 1];

                eventSchema = oldSchema.replace(reg, "");
                console.log('Event Schema:', eventSchema);
            }
        }
    }

    /**
     * Perform initial data loading actions when the custom activity is opened in Journey Builder.
     * This function is invoked to populate the UI with data if available.
     * @param {Object} data - The payload data passed by Journey Builder.
     */
    function initialLoad(data) {
        if (data && data.arguments && data.arguments.execute && data.arguments.execute.inArguments) {
            console.log('Loading Initial Data:', data.arguments.execute.inArguments);
        } else {
            console.warn('No initial data found for the activity.');
        }
    }
});
