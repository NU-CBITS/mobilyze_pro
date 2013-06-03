
var promptAction = function(){


var date_format = "yyyyMMddTHHmmss"; // See date.js...

        var now = new Date();

        var fire_date = new Date();
        fire_date.addMinutes(1);

        var end_date = new Date();
        end_date.addMinutes(3);


        // PurpleRobot.persistString('\"load_prompt\"','\\\"loadPrompt\\\"');
        var new_trigger = {};
        new_trigger.type = "datetime";
        new_trigger.name = "FOCUS Prompt Test Trigger";
        new_trigger.identifier = "js_test";
        new_trigger.action = "PurpleRobot.vibrate('blip'); PurpleRobot.playDefaultTone(); PurpleRobot.showNativeDialog('FOCUS', 'Can you check in with FOCUS right now?', 'YES', 'NO', PurpleRobot.launchApplication(\\'com.cbits.focus\\', {}, null);', 'PurpleRobot.emitToast(\\'Thanks, we will check in later!\\', true);');";

        // new_trigger.action = "PurpleRobot.playDefaultTone();PurpleRobot.persistString(\'load_prompt\',\'loadPrompt\');";
        new_trigger.datetime_start = fire_date.toString(date_format);
        new_trigger.datetime_end = end_date.toString(date_format);
        // new_trigger.datetime_repeat= "FREQ=MINUTELY;INTERVAL=1";


        var json = {};
        json.command = "execute_script";
        json.script = "PurpleRobot.updateTrigger(\"" + new_trigger.identifier + "\", " + JSON.stringify(new_trigger) + ");";

        var post_data = {};
        post_data.json = JSON.stringify(json);

        $.ajax(PurpleRobotClient.serverUrl, {
          type: "POST",
          contentType: "application/x-www-form-urlencoded; charset=UTF-8", 
          data: post_data,
          success: function(data)
          {
            alert("Trigger created. It will launch shortly after " + fire_date + "...");
            console.log("TEST TRIGGER | ",post_data);
            console.log("TEST TRIGGER RESPONSE: " + JSON.stringify(data));
          },
          error: function(jqXHR, textStatus, errorThrown) 
          { 
            alert("Error creating trigger: " + errorThrown);
//            alert("error " + textStatus + " --- " + errorThrown); 
          }
        });




}

