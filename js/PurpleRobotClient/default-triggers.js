function addInitialTriggers(array_of_triggers) {

    var prompt_array = array_of_triggers;
    var date_format = "yyyyMMddTHHmmss"; // See date.js...
    var trigger_array = [];


    _.each(prompt_array, function (i) {
       
        // console.log(i);
        var new_trigger = {};

        new_trigger.type = i.type;
        new_trigger.name = i.name;
        new_trigger.identifier =  i.identifier;


        if (i.clear_trigger == true){
                new_trigger.action = "";
        }
        else {
                new_trigger.action = i.action;            
        }

        datetime_start = new Date(i.datetime_start);
        new_trigger.datetime_start = datetime_start.toString(date_format);

        datetime_end = new Date(i.datetime_end);
        new_trigger.datetime_end = datetime_end.toString(date_format);
        new_trigger.datetime_repeat = i.datetime_repeat;
        trigger_array.push(new_trigger);
        //
    });

    _.each(trigger_array, function (i) {
        PurpleRobotClient.updateTrigger(i.identifier, JSON.stringify(i), "addToQueue");
    });

}