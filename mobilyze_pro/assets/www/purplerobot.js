// Assumes that jQuery & Backbone are already loaded.

if (window.filterOnSync == undefined)
{
	window.filterOnSync = function(method, model, options)
	{
		model = JSON.parse(JSON.stringify(model));
		
		var names = model.names;
		var onSubmit = (names.length > 1);
		
		console.log("Persisting " + JSON.stringify(model));
		
		for (i = 0; i < names.length; i++)
		{
			var name = names[i];
			var type = model.datatypes[i];
			var value = model.values[i];
			
			if (type == "json")
			{
				var json = JSON.parse(value);
				
				if (json.length > 0)
				{
					type = json[0][1];
					value = json[0][2];
				}
				else
					type = "null";
			}
			
			if (type != "null")
			{
				var payload = {};
				payload["name"] = name;
				payload["type"] = type;
				payload["value"] = value;
				
				var json = {};
				json.command = "execute_script";
				json.script = "PurpleRobot.emitReading('" + name + "', " + JSON.stringify(payload) + ");";
	
				var post_data = {};
				post_data.json = JSON.stringify(json);
	
				$.ajax("http://localhost:12345/json/submit", 
				{
					type: "POST",
					contentType: "application/x-www-form-urlencoded; charset=UTF-8", 
					data: post_data,
					success: function(data)
					{
						console.log("Reading emitted...");
					},
					error: function(jqXHR, textStatus, errorThrown) 
					{ 
						console.log("Error emitting reading: " + errorThrown);
					}
				});
			}
		}
	};
	
	var existingSync = Backbone.sync;
	
	Backbone.sync = function (method, model, options)
	{
		window.filterOnSync(method, model, options);
		
		existingSync(method, model, options);
	};
}