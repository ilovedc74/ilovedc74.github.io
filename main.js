<script> 
    // All your javascript code will go here
    let store = {} 
    // function loadData() {
    //     let promise = d3.csv("routes.csv");
    //     return promise.then(routes => {
    //         store.routes = routes;
    //         return store;
    //     })
    // }
    function loadData() {
        return Promise.all([
            d3.csv("routes.csv"),
            d3.json("countries.geo.json"),
        ]).then(datasets => {
            store.routes = datasets[0];
            store.geoJSON = datasets[1]
            return store;
            
            })
    }

    function getMapConfig(){
      let width = 600;
      let height = 400;
      let container = //TODO: select the svg with id Map
        d3.select("#Map").attr("width", width).attr("height", height)
         //TODO: set the width and height of the conatiner to be equal the width and height variables.
      
      return { width, height, container } 
    }

    function getMapProjection(config) {
      let {width, height} = config;
      let projection = //TODO: Create a projection of type Mercator.
        d3.geoMercator()

      projection.scale(97)
                .translate([width / 2, height / 2 + 20])

      store.mapProjection = projection;
      return projection;
    }

    function drawBaseMap(container, countries, projection){
      let path = //TODO: create a geoPath generator and set its projection to be the projection passed as parameter.
        d3.geoPath()
        .projection(projection)

      container.selectAll("path").data(countries)
          .enter().append("path")
          .attr("d", d => path(d))//TODO: use the path generator to draw each country 
          .attr("stroke", "#ccc")
          .attr("fill", "#eee")
    }
    function drawMap(geoJeon) {
        let config = getMapConfig();
        let projection = getMapProjection(config)
        drawBaseMap(config.container, geoJeon.features, projection)
    }

    function groupByAirport(data) {
        //We use reduce to transform a list into a object where each key points to an aiport. This way makes it easy to check if is the first time we are seeing the airport.
        let result = data.reduce((result, d) => {
            //The || sign in the line below means that in case the first option is anything that Javascript consider false (this insclude undefined, null and 0), the second option will be used. Here if result[d.DestAirportID] is false, it means that this is the first time we are seeing the airport, so we will create a new one (second part after ||)

            let currentDest = result[d.DestAirportID] || {
                "AirportID": d.DestAirportID,
                "Airport": d.DestAirport,
                "Latitude": +d.DestLatitude,
                "Longitude": +d.DestLongitude,
                "City": d.DestCity,
                "Country": d.DestCountry,
                "Count": 0
            }
            currentDest.Count += 1
            result[d.DestAirportID] = currentDest

            //After doing for the destination airport, we also update the airport the airplane is departing from.
            let currentSource = result[d.SourceAirportID] || {
                "AirportID": d.SourceAirportID,
                "Airport": d.SourceAirport,
                "Latitude": +d.SourceLatitude,
                "Longitude": +d.SourceLongitude,
                "City": d.SourceCity,
                "Country": d.SourceCountry,
                "Count": 0
            }
            currentSource.Count += 1
            result[d.SourceAirportID] = currentSource

            return result
        }, {})

        //We map the keys to the actual airports, this is an way to transform the object we got in the previous step into a list.
        result = Object.keys(result).map(key => result[key])
        return result
    }

    function drawAirports(airports) {
      let config = getMapConfig(); //get the config
      let projection = getMapProjection(config) //get the projection
      let container = config.container; //get the container

      let circles = container.selectAll("circle")   
      //TODO: bind the airports to the circles using the .data method.
            .data(airports)
            .enter().append("circle")
            .attr("r", 1)
            .attr("cx", d => projection([+d.Longitude, +d.Latitude])[0])
            .attr("cy", d => projection([+d.Longitude, +d.Latitude])[1])
            .style("fill", "#2a5599")
      //TODO: for each new airport (hint: .enter)
      //      - Set the radius to 1
      //      - set the x and y position of the circle using the projection to convert longitude and latitude to x and y    porision.
      //      - Set the fill color of the circle to  "#2a5599"
    }

    function groupByAirline(data) {
        //Iterate over each route, producing a dictionary where the keys is are the ailines ids and the values are the information of the airline.
        let result = data.reduce((result, d) => {
            let currentData = result[d.AirlineID] || 
            {
                "AirlineID": d.AirlineID,
                "AirlineName": d.AirlineName,
                "Count": 0
            }
            currentData.Count +=  1

            result[d.AirlineID] = currentData;

            return result;
        }, {})


        result = Object.keys(result).map(key => result[key])
        result = result.sort(function(d1,d2){
            return d3.descending(
                d1.Count,
                d2.Count
            )
        })

        return result;
    }

    function drawAirlinesChart(airlines) {
        
        let config = getAirlinesChartConfig()
    }

    function getAirlinesChartConfig() {
        let width = 350;
        let height = 400;
        let margin = {
            top: 10,
            bottom: 50,
            left: 130,
            right: 10
        }
        //The body is the area that will be occupied by the bars.
        let bodyHeight = height - margin.top - margin.bottom
        let bodyWidth = width - margin.left - margin.right
        //TODO: Compute the width of the body by subtracting the left and right margins from the width.

        //The container is the SVG where we will draw the chart. In our HTML is the svg tag with the id AirlinesChart
        let container = d3.select("#AirlinesChart")//TODO: use d3.select to select the element with id AirlinesChart 
        container
            .attr("width", width)
            .attr("height", height)
           //TODO: Set the height of the container

        return { width, height, margin, bodyHeight, bodyWidth, container }
    }

    function getAirlinesChartScales(airlines, config) {
        let { bodyWidth, bodyHeight } = config;
        let maximunCount = d3.max(airlines, d => d.Count)//TODO: Use d3.max to get the highest Count value we have on the airlines list.
        // console.log(maximunCount)
        let xScale = d3.scaleLinear()
            .range([0, bodyWidth])
            .domain([0, maximunCount])
            //TODO: Set the range to go from 0 to the width of the body
            //TODO: Set the domain to go from 0 to the maximun value fount for the field 'Count'

        let yScale = d3.scaleBand()
            .range([0, bodyHeight])
            .domain(airlines.map(a => a.AirlineName)) //The domain is the list of airlines names
            .padding(0.2)

        return { xScale, yScale }
    }

    function drawBarsAirlinesChart(airlines, scales, config) {
      let {margin, container} = config; // this is equivalent to 'let margin = config.margin; let container = config.container'
      let {xScale, yScale} = scales
      let body = container.append("g")
          .style("transform", 
            `translate(${margin.left}px,${margin.top}px)`
          )

      let bars = body.selectAll(".bar").data(airlines); //?
          //TODO: Use the .data method to bind the airlines to the bars (elements with class bar)

      //Adding a rect tag for each airline
      bars.enter().append("rect")
          .attr("height", yScale.bandwidth())
          .attr("y", (d) => yScale(d.AirlineName))
          .attr("width", (d) => xScale(d.Count)) //??
          //TODO: set the width of the bar to be proportional to the airline count using the xScale
          .attr("fill", "#2a5599")
          //... Here is our original code -> next is for hover
          .on("mouseenter", function(d) {
               // <- this is the new code
                drawRoutes(d.AirlineID); //??? TODO: call the drawRoutes function passing the AirlineID id 'd'
                d3.select(this).attr("fill", "#992a5b") //TODO: change the fill color of the bar to "#992a5b" as a way to highlight the bar. Hint: use d3.select(this)
          })
          //TODO: Add another listener, this time for mouseleave
          .on("mouseleave", function(d) {
                drawRoutes(null);
                d3.select(this).attr("fill", "#2a5599")
          //TODO: In this listener, call drawRoutes(null), this will cause the function to remove all lines in the     chart since there is no airline with AirlineID == null.
          //TODO: change the fill color of the bar back to "#2a5599"
          })
    }

    function drawAxesAirlinesChart(airlines, scales, config){
        let {xScale, yScale} = scales
        let {container, margin, height} = config;
        let axisX = d3.axisBottom(xScale)
                      .ticks(5)

        container.append("g")
          .style("transform", 
              `translate(${margin.left}px, ${height - margin.bottom}px)`
          )
          .call(axisX)

        let axisY = d3.axisLeft(yScale)
                      .ticks(5)
        container.append("g")
          .style("transform", 
              `translate(${margin.left}px, ${margin.top}px)`
          )
          .call(axisY)
        //TODO: Create an axis on the left for the Y scale
        //TODO: Append a g tag to the container, translate it based on the margins and call the axisY axis to draw the left axis.
    }

 

    function drawAirlinesChart(airlines) {
    let config = getAirlinesChartConfig();
    let scales = getAirlinesChartScales(airlines, config);
    drawBarsAirlinesChart(airlines, scales, config);
    drawAxesAirlinesChart(airlines, scales, config);
    }



    function drawRoutes(airlineID) {

        let routes = store.routes //TODO: get the routes from store 
        let projection = store.mapProjection //TODO: get the projection from the store 
        let container = d3.select("#Map") //TODO: select the svg with id "Map" (our map container)
        let selectedRoutes = routes.filter(d => d.AirlineID === airlineID)// ??? TODO: filter the routes to keep only the routes which AirlineID is equal to the parameter airlineID received by the function
        
        let bindedData = container.selectAll("line")
            .data(selectedRoutes, d => d.ID) //This second parameter tells D3 what to use to identify the routes, this hepls D3 to correctly find which routes have been added or removed.
        bindedData.enter().append("line")
            .attr("x1", d => projection([+d.SourceLongitude, +d.SourceLatitude])[0])
            .attr("y1", d => projection([+d.SourceLongitude, +d.SourceLatitude])[1])
            .attr("x2", d => projection([+d.DestLongitude, +d.DestLatitude])[0])
            .attr("y2", d => projection([+d.DestLongitude, +d.DestLatitude])[1])
            .style("stroke", "#992a2a")
            .style("opacity", 0.1)
        bindedData.exit().remove()
        
        //TODO: Use the .enter selector to append a line for each new route.
        //TODO: for each line set the start of the line (x1 and y1) to be the position of the source airport    (SourceLongitude and SourceLatitude) Hint: you can use projection to convert longitude and latitude to x and y.
        //TODO: for each line set the end of the line (x2 and y2) to be the position of the source airport  (DestLongitude and DestLongitude)
        
        //TODO: set the color of the stroke of the line to "#992a2a"
        //TODO: set the opacity to 0.1

        //TODO: use exit function over bindedData to remove any routes that does not satisfy the filter.
    }
    

    function showData() {
        //Get the routes from our store variable
        let routes = store.routes
        // Compute the number of routes per airline.
        let airlines = groupByAirline(store.routes);
        console.log(airlines)
            // Draw airlines barchart
        drawAirlinesChart(airlines)
        // console.log(store.geoJSON)
        drawMap(store.geoJSON) //Using the data saved on loadData
        
        let airports = groupByAirport(store.routes);
        drawAirports(airports)
        // drawRoutes() // <- add this line
    }
    
    loadData().then(showData);


 </script>