d3.csv("/data/state_change_small.csv", function(data) {
	window.data = [];
	window.legendOFF = true;
	
	window.max_x = d3.max(data, d => +d.x) + 1;
	window.max_y = d3.max(data, d => +d.y) + 1
	window.max_inhaled = d3.max(data, d => +d.curr_inhaled)
	window.max_particles = d3.max(data, d => +d.current_state)
	
	
	// window.changedata = [];
	// var coordinate = [];


	var times = [];
	
    for(var i=0;i<data.length;i++){
		var idx = times.indexOf(data[i].time);
		
		if (idx == -1) {
			times.push(data[i].time);		
			idx = times.length - 1;
			window.data[idx] = [];
        }
        
		window.data[idx].push({ 
			x:+data[i].x, y:+data[i].y, 
			previous_inhaled:+data[i].prev_inhaled, 
			inhaled:+data[i].curr_inhaled, 
			previous_state:+data[i].previous_state, 
			state:+data[i].current_state, 
			prev_type:+data[i].prev_type,
			type:+data[i].curr_type });
			//type:+data[i].type });

	}
	// First time step occurs twice, so just remove it.
	window.data.shift()

});