if (window.filterOnSync == undefined) {

	window.filterOnSync = function(method, model, options) {

		if ( typeof(model.get_fields_as_object) != "undefined" ) {

			//MAKES A BAD SPARSE TABLE!
			// payload = model.get_fields_as_object();

			// console.log(model.get_fields());
			// console.log("payload to check",payload);
			// console.log("name", name);
			if (model.get_fields()[0]){
			payload = {
				name : model.get_fields()[0][0], 
				type : model.get_fields()[0][1], 
				value : model.get_fields()[0][2]
			};
			console.log(payload);} else {payload = ""};
			PurpleRobotClient.emitReading("mobilyze_eav", payload);
		}

		else {

			model = JSON.parse(JSON.stringify(model));
			console.log("Persisting " + JSON.stringify(model));
			
			for (i = 0; i < names.length; i++) {
				var name = names[i];
				var type = model.datatypes[i];
				var value = model.values[i];
				
				if (type == "json") {
					var json = JSON.parse(value);
					
					if (json.length > 0)
					{
						type = json[0][1];
						value = json[0][2];
					}
					else
						type = "null";
				}
				
				if (type != "null") {

					var payload = {};
					payload["name"] = name;
					payload["type"] = type;
					payload["value"] = value;		

					_.each(["xelement_id", "user_id", "guid"], function(prop) {
						if (model[prop]) {  payload[prop] = model[prop] }
					})


					console.log("payload to check",payload);
					console.log("name", name);

					PurpleRobotClient.emitReading(name, payload, "addToQueue");

				}

			}

			PurpleRobotClient.transmissionQueue.send();

		} // if

	} // filterOnSync
	
	var existingSync = Backbone.sync;

	Backbone.sync = function (method, model, options) {
		window.filterOnSync(method, model, options);
		
		existingSync(method, model, options);
	};

};