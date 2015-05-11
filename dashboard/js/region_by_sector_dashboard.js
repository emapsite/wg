function sector_dashboard(id, fData, title){

   //colour lookup table
   var colours = ["#41ab5d", "#807dba", "#e08214", "#ff1515"];

    //clear entire svg content.
    $(id).empty();

     //calc total spending by department/sector for local and welsh govt spending
     var sums = d3.nest()
           .key(function(d){return d.sector;  })
           .rollup(function(v){
                return {
                    "other": d3.sum(v, function(d){ 
                                         return d.spending.other; }),
                    "welsh_gov": d3.sum(v, function(d){ 
                                         return d.spending.welsh_gov; })
                }
            })   
           .entries(fData);
   

 
    //get category headers, so we can pass generic column names  
    var headers = [];
      $.each(fData[0].spending, function(key, val){
         headers.push(key)
    });
 
 
    var barColor = 'steelblue';
    function segColor(c){
        ans = {};
        headers.forEach(function(k, i){
            ans[k] = colours[i];
        });
        return ans[c];
        //return {'total_cost':"#807dba", 'welsh_gov':"#e08214", 'other':"#41ab5d"}[c];
    }
 
    // compute total spend value for each area.  
    /*fData.forEach(function(d){
        d.total = 0;
       
        $.each(d.spending, function (key, value){
           d.total += value;          
        });
    }); */
 
 
    // function to handle histogram.
    function histoGram(fD){
        var hG={},    hGDim = {t: 60, r: 5, b: 50, l: 5};
        hGDim.w = 330 - hGDim.l - hGDim.r,
        hGDim.h = 320 - hGDim.t - hGDim.b;
 
        //create svg for histogram.
        var hGsvg = d3.select(id).append("svg")
            .attr("width", hGDim.w + hGDim.l + hGDim.r)
            .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
            .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");
 
        // create function for x-axis mapping.
        var x = d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1)
                .domain(fD.map(function(d) { return d[0]; }));
 
        // Add x-axis to the histogram svg and wrap the labels
        hGsvg.append("g").attr("class", "x axis")
            .attr("transform", "translate(0," + hGDim.h + ")")
            .call(d3.svg.axis().scale(x).orient("bottom"))
            .selectAll(".tick text")
            .style("font-family", "Arial")
            .style("font-size", "9px")      
            /*.attr("transform", function(d) {
                return "rotate(-45)" 
            })*/
            .call(wrap, x.rangeBand());
 
 
        // Create function for y-axis map.
        var y = d3.scale.linear().range([hGDim.h, 0])
                .domain([0, d3.max(fD, function(d) {return +d[1];})]);
        
 
        // Create bars for histogram to contain rectangles and freq labels.
        var bars = hGsvg.selectAll(".bar").data(fD).enter()
                .append("g").attr("class", "bar");

       
        //create the rectangles.
        bars.append("rect")
            .attr("x", function(d) { return x(d[0]); })
            .attr("y", function(d) { return y(d[1]); })
            .attr("width", x.rangeBand())
            .attr("height", function(d) { return hGDim.h - y(d[1]); })
            .attr('fill', barColor)
            .on("mouseover", mouseover)// mouseover is defined below.
            .on("mouseout", mouseout);// mouseout is defined below.
 
        //Create the spending labels above the rectangles.
        bars.append("text").text(function(d){ return d3.format(",.2f")(d[1])})
            .attr("x", function(d) { return x(d[0]) + x.rangeBand()/2; })
            .attr("y", function(d) { return y(d[1])-5; })
            .attr("text-anchor", "middle")
            .style("font-family", "Arial") 
            .style("font-size", "12px")
 
 
        //Add title
       hGsvg.append("text")
          .attr("x", 10)            
          .attr("y", -35)
          .attr("text-anchor", "left") 
          .style("font-size", "14px")
          .style("text-decoration", "underline")
          .style("font-weight", "bold")
          .style("font-family", "Arial")
          .text(title);
          //.call(wrap, hGDim.w);
 
 
        function mouseover(d){  // utility function to be called on mouseover.
            // filter for selected dep_dir_name.
            // filter for selected state.
            var st = sums.filter(function(s){                   
                    return s.key == d[0];}
            )[0];
           
            var nD = d3.keys(st.values).map(function(s){
                 return {type: s, spending: st.values[s]};}
            );
 
            // call update functions of pie-chart and legend.   
            pC.update(nD);
            leg.update(nD);
        }
 
        function mouseout(d){    // utility function to be called on mouseout.
            // reset the pie-chart and legend.   
            pC.update(tF);
            leg.update(tF);
        }
 
        // create function to update the bars. This will be used by pie-chart.
        hG.update = function(nD, color){
            // update the domain of the y-axis map to reflect change in frequencies.
            y.domain([0, d3.max(nD, function(d) { return +d[1]; })]);
 
            // Attach the new data to the bars.
            var bars = hGsvg.selectAll(".bar").data(nD);
 
            // transition the height and color of rectangles.
            bars.select("rect").transition().duration(500)
                .attr("y", function(d) {return y(d[1]); })
                .attr("height", function(d) { return hGDim.h - y(d[1]); })
                .attr("fill", color);
 
            // transition the frequency labels location and change value.
            bars.select("text").transition().duration(500)
                .text(function(d){ return d3.format(",.2f")(d[1])})
                .attr("y", function(d) {return y(d[1])-5; });           
        }       
        return hG;
    }
 
    // function to handle pieChart.
    function pieChart(pD){
        var pC ={},    pieDim = {w: 160, h: 160};
        pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;
 
        // create svg for pie chart. -- offset vertically by 10
        var piesvg = d3.select(id).append("svg")
            .attr("width", pieDim.w+20).attr("height", pieDim.h+90).append("g")
            .attr("transform", "translate(" +(pieDim.w/2 + 30 ) + ", " +(pieDim.h/2 - 10)+ ")");
 
        // create function to draw the arcs of the pie slices.
        var arc = d3.svg.arc().outerRadius(pieDim.r - 10).innerRadius(0);
 
        // create a function to compute the pie slice angles.
        var pie = d3.layout.pie().sort(null).value(function(d) { return d.spending; });
 
        // Draw the pie slices.
        piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
            .each(function(d) { this._current = d; })
            .style("fill", function(d) { return segColor(d.data.type); })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);
 
        // create function to update pie-chart. This will be used by histogram.
        pC.update = function(nD){
            piesvg.selectAll("path").data(pie(nD)).transition().duration(750)
                .attrTween("d", arcTween);
        }       
        // Utility function to be called on mouseover a pie slice.
        function mouseover(d){
            // call the update function of histogram with new data.
            hG.update(sums.map(function(v){
                return [v.key, v.values[d.data.type]];}), segColor(d.data.type));
        }
        //Utility function to be called on mouseout a pie slice.
        function mouseout(d){
            // call the update function of histogram with all data, summing two types of spending
            hG.update(sums.map(function(v){
                return [v.key, v.values['welsh_gov'] + v.values['other']]}), barColor);
        }
        // Animating the pie-slice requiring a custom function which specifies
        // how the intermediate paths should be drawn.
        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) { return arc(i(t)); };
        }   
        return pC;
    }
 
    // function to handle legend.
    function legend(lD){
        var leg = {};
 
        // create table for legend.
        var legend = d3.select(id).append("table")
            .attr('class', 'legend')
            .style('position', 'relative')
            .style('left', '320px')
            .style('bottom', '80px');
 
        // create one row per segment.
        var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");
 
        // create the first column for each segment.
        tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
            .attr("width", '16').attr("height", '16')
            .attr("fill", function(d){ return segColor(d.type); });
 
        // create the second column for each segment -- formatting the text nicely
        tr.append("td")            
            .text(function(d){ return d.type.replace(/_/g,' ')
            .replace(/\w\S*/g, function(txt){ //nice formatting
                 return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        });
 
        // create the third column for each segment.
        tr.append("td").attr("class",'legendFreq')
            .style("font-family", "Arial")
            .text(function(d){ return d3.format(",.2f")(d.spending);});
 
        // create the fourth column for each segment.
        tr.append("td").attr("class",'legendPerc')
            .style("font-family", "Arial")
            .text(function(d){ return getLegend(d, lD);});
 
        // Utility function to be used to update the legend.
        leg.update = function(nD){
            // update the data attached to the row elements.
            var l = legend.select("tbody").selectAll("tr").data(nD);
 
            // update the frequencies.
            l.select(".legendFreq").text(function(d){ return d3.format(",.2f")(d.spending);});
 
            // update the percentage column.
            l.select(".legendPerc").text(function(d){ return getLegend(d, nD);});       
        }
 
        function getLegend(d,aD){ // Utility function to compute percentage.
            return d3.format("%")(d.spending/d3.sum(aD.map(function(v){ return v.spending; })));
        }
 
        return leg;
    }
 
    // calculate total frequency by segment for all dep_dir_name.
    var tF = headers.map(function(d){
    //var tF = ['total_cost','welsh_gov','other'].map(function(d){
        return {type:d, spending: d3.sum(fData.map(function(t){ return t.spending[d];}))};
    });    
  
    // calculate total frequency by dep_dir_name for all segment.
    //var sF = fData.map(function(d){return [d.dep_dir_name, d.total];});
   
    //send total for each department
    var sF = sums.map(function(d){        
        return [d.key,  [d.values.welsh_gov + d.values.other]];
    });
 
    var hG = histoGram(sF), // create the histogram.
        pC = pieChart(tF), // create the pie-chart.
        leg = legend(tF);  // create the legend.
}
 
 //wrap text on axis
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {       
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}


var freqDataSec = [{"dep_dir_name":"Economy, Science and Transport","sector":"Economic Development","local_authority":"Wales","spending":{"other":368,"welsh_gov":70}},{"dep_dir_name":"Economy, Science and Transport","sector":"Heritage ","local_authority":"Wales","spending":{"other":34,"welsh_gov":22}},{"dep_dir_name":"Economy, Science and Transport","sector":"Transport","local_authority":"Wales","spending":{"other":0,"welsh_gov":334}},{"dep_dir_name":"Education and Skills","sector":"Education","local_authority":"Wales","spending":{"other":48,"welsh_gov":70}},{"dep_dir_name":"Environment and Sustainable Development","sector":"Environment","local_authority":"Wales","spending":{"other":9,"welsh_gov":53}},{"dep_dir_name":"Health and Social Services","sector":"Health","local_authority":"Wales","spending":{"other":0,"welsh_gov":369}},{"dep_dir_name":"Local Government and Communities","sector":"Housing & Regeneration","local_authority":"Wales","spending":{"other":98,"welsh_gov":113}}];
 

