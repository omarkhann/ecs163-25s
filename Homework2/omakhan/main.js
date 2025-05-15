//DISCLAIMER: I utilized ChatGPT to aid me in this assignment. I used it to learn how to fix issues with javascript syntax and string manipulation, process my data properly, correctly intitialize scales and positions, and add details to my visualizations such as labels. It also gave me insight into HTML and CSS and how to manipulate containers to place my visualizations as desired on the dashbaord. I also learned more about how to properly format data for the d3 sankey library to use it properly.

// NOTE: For the Sankey diagram, one person can have multiple mental health conditions, so the flow out of the "Year" bars will be larger than the flow in. I was unsure how to implement this in the sankey diagram, since it would mean the flows overlap. This may be a drawback of choosing the sankey but its was too late to change it.

d3.csv("data/Student Mental health.csv").then(data => {
    create_bar_chart(data);
    create_pie(data);
    create_sankey(data);
});

const mental_health_categories = ["Do you have Depression?", "Do you have Anxiety?", "Do you have Panic attack?", "No Conditions"];

const color_scale = d3.scaleOrdinal()
    .domain(mental_health_categories)
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#424A54"]); // ues to keep color consistent across charts

const year_categories = ["Year 1", "Year 2", "Year 3", "Year 4"];

const color_scale_year = d3.scaleOrdinal()
    .domain(year_categories)
    .range(["#C0CCC2", "#84A59D", "#A4Ac86", "#B09C8D"]);

const num_conditions = ["0 Conditions", "1 Conditions", "2 Conditions", "3 Conditions"];

const conditions_color_scale = d3.scaleOrdinal()
    .domain(num_conditions)
    .range(["#32a852", "#1240a3", "#ed3257", "#ffe014"]);

// make a bar chart to depict the spread of each mental health option by gender
function create_bar_chart(data) {

    const width = 500;
    const height = 450;
    const margin = { top: 10, right: 30, bottom: 50, left: 50 };

    // make a container for the title
    d3.select("#bar-chart-container")
        .append("h3")
        .text("Student Mental Health by Gender")
        .style("text-align", "center")
        .style("margin-bottom", "1px");

    // container for the chart
    const svg = d3.select("#bar-chart-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // process data: count occurrences of mental health category per gender
    const grouped_data = {};

    data.forEach(d => {
        const gender = d["Choose your gender"]?.trim();
        if (!gender) return;

        let has_conditions = false;

        mental_health_categories.slice(0, -1).forEach(category => {
            const response = d[category]?.trim();
            if (response === "Yes") {
                has_conditions = true;

                // map categories to each gender
                const key = `${gender}->${category}`;
                if (grouped_data[key]) {
                    grouped_data[key]++;
                } else {
                    grouped_data[key] = 1;
                }
            }
        });

        // record entries with no mental health conditions
        if (!has_conditions) {
            const key = `${gender}->No Conditions`;
            if (grouped_data[key]) {
                grouped_data[key]++;
            } else {
                grouped_data[key] = 1;
            }
        }
    });

    // convert grouped data into an array for D3
    const grouped_data_array = [];
    Object.entries(grouped_data).forEach(([key, value]) => {
        const [gender, category] = key.split("->");
        grouped_data_array.push({ gender, category, count: value });
    });

    // calculate total counts for each gender
    const gender_totals = {};
    grouped_data_array.forEach(d => {
        if (!gender_totals[d.gender]) {
            gender_totals[d.gender] = 0;
        }
        gender_totals[d.gender] += d.count;
    });

    // normalize data to calculate relative frequencies
    grouped_data_array.forEach(d => {
        d.relativeFrequency = d.count / gender_totals[d.gender];
    });

    // set up scales
    const x0_scale = d3.scaleBand()
        .domain([...new Set(grouped_data_array.map(d => d.gender))])
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const x1_scale = d3.scaleBand()
        .domain(mental_health_categories)
        .range([0, x0_scale.bandwidth()])
        .padding(0.1);

    const y_scale = d3.scaleLinear()
        .domain([0, 0.4]) // y axis up to 40%
        .nice()
        .range([height - margin.bottom, margin.top]);

    // add axes
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x0_scale))
        .selectAll("text")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y_scale).tickFormat(d3.format(".0%"))); // format as percentages

    // draw bars
    const gender_groups = svg.append("g")
        .selectAll("g")
        .data(d3.group(grouped_data_array, d => d.gender)) // group by gender
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x0_scale(d[0])},0)`); // position by gender

    gender_groups.selectAll("rect")
        .data(d => d[1])
        .enter()
        .append("rect")
        .attr("x", d => x1_scale(d.category)) // position by mental health category
        .attr("y", d => y_scale(d.relativeFrequency))
        .attr("width", x1_scale.bandwidth())
        .attr("height", d => height - margin.bottom - y_scale(d.relativeFrequency))
        .attr("fill", d => color_scale(d.category));

    // add labels
    gender_groups.selectAll("text")
        .data(d => d[1])
        .enter()
        .append("text")
        .attr("x", d => x1_scale(d.category) + x1_scale.bandwidth() / 2)
        .attr("y", d => y_scale(d.relativeFrequency) - 5)
        .attr("text-anchor", "middle")
        .text(d => d3.format(".0%")(d.relativeFrequency)); // format as percentages

    // add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right - 150}, ${margin.top})`); // position the legend

    mental_health_categories.forEach((category, i) => {
        const legend_item = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`); // position each legend item vertically

        // add colored rectangle
        legend_item.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color_scale(category));

        // add text label
        legend_item.append("text")
            .attr("x", 20) // position text to the right of the rectangle
            .attr("y", 12) // align text vertically with the rectangle
            .text(category)
            .style("font-size", "12px");
    });
}

function process_data_for_sankey(data) {
    // count occurrences for each gender, year, mental health condition, and treatment
    const links = [];
    const gender_year_counts = {};
    const year_condition_counts = {};
    const condition_treatment_counts = {};

    data.forEach(d => {
        const gender = d["Choose your gender"]?.trim();
        let year = d["Your current year of Study"]?.trim();
        const treatment = d["Did you seek any specialist for a treatment?"]?.trim();
    
        year = year.charAt(0).toUpperCase() + year.slice(1); // standarize year format to "Year X", because the data has both "year X" and "Year X"

        // count links from gender to year
        const gender_year_key = `${gender}->${year}`;
        if (gender_year_counts[gender_year_key]) {
            gender_year_counts[gender_year_key]++;
        } else {
            gender_year_counts[gender_year_key] = 1;
        }

        // count links from year to each mental health condition (including no condition)
        // NOTE: one person can have multiple conditions, so the flow out of the year bars will be larger than the flow in. This may be a drawback of choosing the sankey but its too late to change it.
        let has_conditions = false;

        mental_health_categories.forEach(category => {
            const response = d[category]?.trim();
            if (response === "Yes") {
                has_conditions = true;

                // count links from year to each mental health condition
                const year_condition_key = `${year}->${category}`;
                if (year_condition_counts[year_condition_key]) {
                    year_condition_counts[year_condition_key]++;
                } else {
                    year_condition_counts[year_condition_key] = 1;
                }

                // count links from condition to treatment
                const condition_treatment_key = `${category}->${treatment}`;
                if (condition_treatment_counts[condition_treatment_key]) {
                    condition_treatment_counts[condition_treatment_key]++;
                } else {
                    condition_treatment_counts[condition_treatment_key] = 1;
                }
            }
        });

        // include those with no reported conditions
        if (!has_conditions) {
            const year_condition_key = `${year}->No Conditions`;
            if (year_condition_counts[year_condition_key]) {
                year_condition_counts[year_condition_key]++;
            } else {
                year_condition_counts[year_condition_key] = 1;
            }

            const condition_treatment_key = `No Conditions->${treatment}`;
            if (condition_treatment_counts[condition_treatment_key]) {
                condition_treatment_counts[condition_treatment_key]++;
            } else {
                condition_treatment_counts[condition_treatment_key] = 1;
            }
        }
    });

    // make sankey links from the counts
    Object.entries(gender_year_counts).forEach(([key, value]) => {
        const [gender, year] = key.split("->");
        links.push({ source: gender, target: year, value });
    });

    Object.entries(year_condition_counts).forEach(([key, value]) => {
        const [year, condition] = key.split("->");
        links.push({ source: year, target: condition, value });
    });

    Object.entries(condition_treatment_counts).forEach(([key, value]) => {
        const [condition, treatment] = key.split("->");
        links.push({ source: condition, target: treatment, value });
    });

    // create unique nodes
    const uniqueNodes = new Set(links.flatMap(link => [link.source, link.target]));
    const nodes = Array.from(uniqueNodes).map(name => ({ name }));

    // update links to use node indices
    links.forEach(link => {
        link.source = nodes.findIndex(node => node.name === link.source);
        link.target = nodes.findIndex(node => node.name === link.target);
    });

    return {nodes, links};
}

function create_sankey(data) {
    console.log("Sankey Data:", process_data_for_sankey(data));
    const sankey_data = process_data_for_sankey(data);

    const width = 900;
    const height = 700;

    // create a container
    const sankey_container = d3.select("#sankey-container")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center");

    // add a title
    sankey_container.append("h3")
        .text("Sankey Diagram: Mental Health Flow")
        .style("text-align", "center")
        .style("margin-bottom", "10px");

    // create container for the actual diagram
    const svg = sankey_container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // create sankey
    const sankey = d3.sankey()
        .nodeWidth(20)
        .nodePadding(10)
        .size([width, height]);

    const {nodes, links} = sankey(sankey_data);

    // draw links
    svg.append("g")
        .selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => {
            // use color_scale for mental health categories
            if (mental_health_categories.includes(d.source.name)) {
                return color_scale(d.source.name);
            }  else if (year_categories.includes(d.source.name)) {
                return color_scale_year(d.source.name);
            } else if (d.source.name == "Male") {
                return "#9BA4A8"; 
            } else if (d.source.name == "Female") {
                return "#C4CFD7"; 
            }
        })
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("fill", "none")
        .attr("opacity", 0.7);

    // draw nodes
    const node = svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .enter()
        .append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => {
            // use color_scale for mental health categories
            if (mental_health_categories.includes(d.name)) {
                return color_scale(d.name);
            } else if (d.name == "Yes") {
                return "green"; // color for treatment
            } else if (d.name == "No") {
                return "red"; // color for no treatment
            } else if (year_categories.includes(d.name)) {
                return color_scale_year(d.name); // color for year
            } else if (d.name == "Male") {
                return "#9BA4A8"; 
            } else if (d.name == "Female") {
                return "#C4CFD8"; 
            }
        })
        .attr("stroke", "black");

    // add node labels
    svg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("x", d => d.x0 === 0 ? d.x1 + 50 : d.x0 - 10) // alter first label so its not cut off
        .attr("y", d => (d.y0 + d.y1) / 2)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "middle")
        .style("font-size", "15px")
        .style("stroke", "white")
        .style("stroke-width", "4px")
        .style("paint-order", "stroke")
        .style("fill", "black")
        .text(d => d.name);

    const categories = ["Gender", "School Year", "Mental Health", "Seeked Treatment"];
    const x_pos = [...new Set(nodes.map(d => d.x0))]; // unique x0 positions

    // category labels
    svg.append("g")
        .selectAll("text")
        .data(categories)
        .enter()
        .append("text")
        .attr("x", (d, i) => {
            if (i == 0 || i == 1) {
                return x_pos[i] + 10; // left align first two
            } else if (i == 2) {
                return x_pos[i] - 50; // center third one bc its long
            } else {
                return width - 150 // right align last one so its not cut off
            }
        }) // position above each section
        .attr("y", 20) // fixed vertical position above the diagram
        .attr("text-anchor", "start")
        .style("font-size", "19px")
        .style("font-weight", "bold")
        .style("stroke", "white")
        .style("stroke-width", "5px")
        .style("paint-order", "stroke")
        .text(d => d); // category names from data
}

function create_pie(data) {
    const width = 170;
    const height = 170;
    const radius = Math.min(width, height) / 2;

    // title
    d3.select("#pie-chart-container")
        .append("h3")
        .text("Number of Reported Mental Health Conditions by Year")
        .style("text-align", "left")
        .style("margin-bottom", "1px"); // small to make things fit

    // create container for pie chart
    const container = d3.select("#pie-chart-container")
        .style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("gap", "10px")
        .style("margin-top", "1px") // also very small to make it fit
        .style("margin-left", "85px");


    // process data: total the number of conditions for each year of students
    const pie_data = year_categories.map(year => {
        const condition_counts = {};

        for (let i = 0; i <= 3; i++) {
            condition_counts[i] = 0;
        }

        data.forEach(d => {
            let student_year = d["Your current year of Study"]?.trim();
            if (student_year) {
                // normalize the year format ("year 1" to "Year 1")
                student_year = student_year.charAt(0).toUpperCase() + student_year.slice(1).toLowerCase();

                if (student_year === year) {
                    // count the number of "Yes" responses for mental health categories
                    const num_conds = mental_health_categories.slice(0, -1).reduce((count, category) => {
                        const response = d[category]?.trim();
                        return response === "Yes" ? count + 1 : count;
                    }, 0);

                    // increment the count for the corresponding number of conditions
                    condition_counts[num_conds]++;
                }
            }
        });

        return {year, conditionCounts: condition_counts};
    });

    // create a pie chart for each year
    pie_data.forEach(({ year, conditionCounts }) => {

         // Cceate a container for each pie chart with a title
        const chart_container = container.append("div")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center");

        // add title
        chart_container.append("text")
            .text(year)
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("margin-bottom", "0px");
        // make svg
        const svg = chart_container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        // make the pie generator
        const pie = d3.pie()
            .value(d => d.value)
            .sort(null);

        // prepare data for the pie chart
        const pie_chart_data = Object.entries(conditionCounts).map(([numConditions, count]) => ({
            label: `${numConditions} Conditions`,
            value: count,
            color: conditions_color_scale(`${numConditions} Conditions`)
        }));

        // arc generator
        const arc = d3.arc()
            .innerRadius(0) // no empty center
            .outerRadius(radius);

        // draw the pies
        svg.selectAll("path")
            .data(pie(pie_chart_data))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => d.data.color);

        // add a title for each pie chart
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -radius - 10)
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(year);
    });

    // make legend below
    const legend_container = d3.select("#pie-chart-container")
        .append("div")
        .style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("gap", "20px")
        .style("margin-top", "0px"); // again trying to fit on page

    // define legend data
    const legend_data = [
        { label: "0 Conditions", color: conditions_color_scale("0 Conditions") },
        { label: "1 Condition", color: conditions_color_scale("1 Conditions") },
        { label: "2 Conditions", color: conditions_color_scale("2 Conditions") },
        { label: "3 Conditions", color: conditions_color_scale("3 Conditions") }
    ];

    // add items
    legend_data.forEach(item => {
        const legend_item = legend_container.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "5px");

        // add color boxes
        legend_item.append("div")
            .style("width", "15px")
            .style("height", "15px")
            .style("background-color", item.color);

        // add labels
        legend_item.append("span")
            .text(item.label)
            .style("font-size", "12px");
    });
}