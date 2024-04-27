 
        let measure = 'mortalityrate';
    
		const cols = {
            "mortalityrate": {
                "label": "Mortality Rate",
                "type": "number",
                "format": ",.0f",
                "title": "Mortality rate, under-5 (per 1,000 live births)",
                "latestyear": "2016",
                "url": "http://www.childmortality.org/",
                "source": "childmortality.org",
                "description": "Estimates Developed by the UN Inter-agency Group for Child Mortality Estimation ( UNICEF, WHO, World Bank, UN DESA Population Division ). Projected data are from the United Nations Population Division's World Population Prospects; and may in some cases not be consistent with data before the current year."
            },
            "dyingyoung": {
                "label": "Probability Dying Young",
                "type": "percentage",
                "format": ".1%",
                "title": "Probability of dying at age 5-14 years (per 1,000 children age 5)",
                "latestyear": "2016",
                "url": "http://www.childmortality.org/",
                "source": "childmortality.org",
                "description": "Estimates Developed by the UN Inter-agency Group for Child Mortality Estimation ( UNICEF, WHO, World Bank, UN DESA Population Division )"
            }
		}
		
        const opts = {
            lines: 9, // The number of lines to draw
            length: 9, // The length of each line
            width: 5, // The line thickness
            radius: 14, // The radius of the inner circle
            color: '#c10e19', // #rgb or #rrggbb or array of colors
            speed: 1.9, // Rounds per second
            trail: 40, // Afterglow percentage
            className: 'spinner', // The CSS class to assign to the spinner
        };

        // create spinner
        let target = d3.select("body").node();

        // trigger loader
        let spinner = new Spinner(opts).spin(target);

        // create tooltip
        let tooltip = d3.select("body").append("div").style("position", "absolute").style("z-index", "10").style("visibility", "hidden").attr("class", "tooltip");
	
        // select element
        let measureSelect = d3.select('#dimensions');

        let width = 960;
        let height = 720;
        
        let projection = d3.geoMercator()
    		.scale(410)
    		.translate([width / 3, height / 2]);
		
		let path = d3.geoPath()
		    .projection(projection);
		
       
        let d3legend = d3.legendColor()
            .shapeWidth(width / 10)
            .cells(9)
            .orient("horizontal")
            .labelOffset(3)
            .ascending(true)
            .labelAlign("middle")
            .shapePadding(2);

        let svg = d3.select("svg")
            .attr("width", width)
            .attr("height", height);

        // create options for select element
        var selectEnter = measureSelect.selectAll('option').data(d3.keys(cols).sort()).enter();

        var selectUpdate = selectEnter.append('option');

        selectUpdate.attr('value', function(d) {
            return d;
        }).text(function(d) {
            return cols[d].title;
        }).attr('selected', function(d) {
            if (d == measure) {
                return true;
            }
        });

        let countryObj = {};

        function createMap(error, africa, data) {

            if (error) throw error;

            // stop spin.js loader
            spinner.stop();

			data.forEach(function(d){
				d.mortalityrate = +d['Mortality Rate'];
				d.dyingyoung = +d['Prob of Dying'];
				countryObj[d.adm0_a3_is] = d;
			});
		
	        let centered;
	
	        // render map colors based on data
	        function renderMap() {
	
	            // counter for missing counties (usually in Alaska)
	            let countMissing = 0;
	
	            let extent = d3.extent(data, function(d) {
	                return +countryObj[d.adm0_a3_is][measure];
	            });
	
	            let color = d3.scaleSequential().interpolator(d3.interpolateOranges);
	            color.domain([extent[0], extent[1]]);
	
                d3legend
                    .labelFormat(function(d) {
                        let value;

                        if (cols[measure].type == 'percentage') {
                            value = (d / 100);
                        }
                        else {
                            value = d;
                        }
                        return d3.format(cols[measure].format)(value);
                    })
                    .title(cols[measure].label)
                    .scale(color);

                // if legend already exists, remove and create again
                svg.select('.legend').remove();

                // create legend
                let legend = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(" + (width / 24) + "," + (height * 6 / 7) + ")");

                legend
                    .call(d3legend);

                countryPath
	                .transition()
	                .duration(1000)
	                .style("fill", function(d) {
	                    let country = countryObj[d.properties.adm0_a3_is];
	                    if(country && country[measure] === null) {
	                        console.log(country.Country + " does not have data");
	                        return '#ccc';
	                    }
	                    else if (country) {
	                        return color(country[measure]);
	                        
	                    }
	                    else {
	                    	countMissing++;
	                    	console.log(d.properties.formal_en + " not found. Error #" + countMissing);
	                    	return '#ccc';
	                    }
	                });
	
	        }
	
	        // define zoom function
	        function zoomed() {
	            group.attr("transform", d3.event.transform);
	           
	        }
	
	        // When clicked, zoom in
	        function clicked(d) {
	            var x, y, k;
	
	            // Compute centroid of the selected path
	            if (d && centered !== d) {
	                // if (d) {
	                var centroid = path.centroid(d);
	                x = centroid[0];
	                y = centroid[1];
	                // k = zoom.scaleExtent()[1];
	                k = 10;
	                centered = d;
	            }
	            else {
	                x = width / 2;
	                y = height / 2;
	                k = 1;
	                centered = null;
	            }
	
	            // Manually Zoom
	            svg.transition()
	                .duration(750)
	                .call(zoom.transform, d3.zoomIdentity
	                    .translate(width / 2, height / 2)
	                    .scale(k)
	                    .translate(-x, -y));
	        }
	
	        // create background box for zoom
	        svg.append("rect")
	            .attr("class", "background")
	            .attr("width", width)
	            .attr("height", height);
	
	        let zoom = d3.zoom()
	            .scaleExtent([1, 15])
	            .on("zoom", zoomed);
	
	        svg.style("pointer-events", "all")
	            .call(zoom);
	
			let group = svg.append("g")
				.attr("class","continent");
	
	        let countryPath = group.selectAll(".countries")
	            .data(topojson.feature(africa, africa.objects.collection).features)
	            .enter()
	            .append('path')
	            .attr("class", "country-border")
	            .on("click", clicked)
	            .attr("d", path);
	            
	        renderMap();
	        renderText();
	        bindHover();
	        setResponsiveSVG();

            measureSelect.on('change', function(d) {
                measure = this.value;
				renderMap();
				renderText();
            });
	        
        }
        
        // change factor description
        function renderText() {

            let textHeader = d3.select('#textDescription h3');
            let textDescription = d3.select('#textDescription p');
            let textFootnote = d3.select('#source > footnote');

            let title = cols[measure].title;
            let description = cols[measure].description;
            let url = cols[measure].url;
            let source = cols[measure].source;

            textHeader.style("opacity", 0).transition().duration(1000).style("opacity", 1).text(title);
            textDescription.style("opacity", 0).transition().duration(1000).style("opacity", 1).text(description);
            textFootnote.html('<em>Source: </em><span><a href="' + url + '" target="_blank">' + source + '</span></a>');
        }
        
        // define mouseover and mouseout events
        // to ensure mouseover events work on IE
        function bindHover() {
            document.body.addEventListener('mousemove', function(e) {

                if (e.target.nodeName == 'path') {
                    let d = d3.select(e.target).data()[0].properties;
                    let value = countryObj[d.adm0_a3_is][measure];
                    let content = '';
                    if (value === null) {
                        content = countryObj[d.adm0_a3_is].geounit + ': ' + 'No data';
                    } else {
                        content = "<b>" + d.admin + '</b><br>' + "Income Group: " + d.income_grp + '<br>' + 'Economy: ' + d.economy + '<br>' + 'Mortality Rate: ' + countryObj[d.adm0_a3_is]['mortalityrate'] + '<br>' + 'Probability of Dying Young: ' + d3.format('.1%')(countryObj[d.adm0_a3_is]['dyingyoung']/100);
                    	
                    }
                        

		            showDetail(e, content);
                }
            });

            document.body.addEventListener('mouseout', function(e) {
                if (e.target.nodeName == 'path') hideDetail();
            });
        }

        // Show tooltip on hover
        function showDetail(event, content) {

            // show tooltip with information from the __data__ property of the element
            let x_hover = 0;
            let y_hover = 0;

            let tooltipWidth = parseInt(tooltip.style('width'));
            let tooltipHeight = parseInt(tooltip.style('height'));
            let classed, notClassed;

            if (event.pageX > document.body.clientWidth / 2) {
                x_hover = tooltipWidth + 30;
                classed = 'right';
                notClassed = 'left';
            }
            else {
                x_hover = -30;
                classed = 'left';
                notClassed = 'right';
            }

            y_hover = (document.body.clientHeight - event.pageY < (tooltipHeight + 4)) ? event.pageY - (tooltipHeight + 4) : event.pageY - tooltipHeight / 2;

            return tooltip
                .classed(classed, true)
                .classed(notClassed, false)
                .style("visibility", "visible")
                .style("top", y_hover + "px")
                .style("left", (event.pageX - x_hover) + "px")
                .html(content);
        }

        // Hide tooltip on hover
        function hideDetail() {

            // hide tooltip
            return tooltip.style("visibility", "hidden");
        }

      
        function setResponsiveSVG() {
            let width = +d3.select('svg').attr('width');
            let height = +d3.select('svg').attr('height');
            let calcString = +(height / width) * 100 + "%";

            let svgElement = d3.select('svg');
            let svgParent = d3.select(d3.select('svg').node().parentNode);

            svgElement
                .attr('class', 'scaling-svg')
                .attr('preserveAspectRatio', 'xMinYMin')
                .attr('viewBox', '0 0 ' + width + ' ' + height)
                .attr('width', null)
                .attr('height', null);

            svgParent.style('padding-bottom', calcString);
        }

        d3.queue()
            .defer(d3.json, "https://gist.githubusercontent.com/DimsumPanda/88aa1d70cd0c394feeae/raw/192d7eed828268ea91b24c100063992042f86835/africa.topojson")
            .defer(d3.csv, "https://raw.githubusercontent.com/tonmcg/shiny_maps/master/www/data.csv")
            .await(createMap);
        