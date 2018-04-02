/**
 * ©2018 Thanh Tran
 *
 * The collapsible tree example: https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd
 */
/*global $, d3, jsyaml*/
$(function() {
	var width = window.innerWidth;
	var height = window.innerHeight;
	var halfWidth = width / 2;
	// append the svg obgect to the body of the page
	// appends a 'group' element to 'svg'
	// moves the 'group' element to the top left margin
	var svg = d3
		.select('#tree')
		.append('svg')
		.attr('width', width)
		.attr('height', height);

	var rectBg = svg
		.append('rect')
		.attr('width', width)
		.attr('height', height)
		.attr('fill', '#ddd');

	svg = svg.append('g').attr('class', 'tree-container');

	var zoom = d3
		.zoom()
		.scaleExtent([0.5, 10])
		.on('zoom', function() {
			// console.log('on zoom', d3.event.transform);
			svg.attr('transform', d3.event.transform);
		});

	// initial panning position
	// FIXME: there is known issue that the tree container shift left suddently when start panning
	zoom.translateBy(svg, 90, 0);
	// svg.call(zoom.transform, d3.zoomIdentity.translate(90, 0));

	rectBg.call(zoom);

	var data = {
		name: 'Top Level',
	};

	$.get('data/trans.yml').done(function(dataStr) {
		console.log(dataStr);
		data = jsyaml.load(dataStr);

		// Assigns parent, children, height, depth
		root = d3.hierarchy(data, function(d) {
			return d.children;
		});
		root.x0 = height / 2;
		root.y0 = 0;

		// Collapse after the second level
		root.children.forEach(collapse);

		update(root);
	});

	var i = 0;
	var duration = 750;
	var root;

	// declares a tree layout and assigns the size
	var treemap = d3
		.tree()
		.size([800, width])
		.separation(function(a, b) {
			// TODO: separation and size by depth
			return a.parent === b.parent ? 3 : 4;
		});

	// Collapse the node and all it's children
	function collapse(d) {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			// expand all by default
			// d.children = null;
		}
	}

	function update(source) {
		// Assigns the x and y position for the nodes
		var treeData = treemap(root);

		// Compute the new tree layout.
		var nodes = treeData.descendants();
		var links = treeData.descendants().slice(1);

		// Normalize for fixed-depth.
		nodes.forEach(function(d) {
			d.y = d.depth * 250;
		});

		// ****************** Nodes section ***************************

		// Update the nodes...
		var node = svg.selectAll('g.node').data(nodes, function(d) {
			return d.id || (d.id = ++i);
		});

		// Enter any new modes at the parent's previous position.
		var nodeEnter = node
			.enter()
			.append('g')
			.attr('class', 'node')
			.attr('transform', function(/*d*/) {
				return 'translate(' + source.y0 + ',' + source.x0 + ')';
			})
			.on('click', click);

		var boxW = 150;
		var boxH = 34;

		// Add Rectangle as text box for the nodes
		nodeEnter
			.append('rect')
			.attr('class', 'node')
			.attr('x', -boxW / 2)
			.attr('y', -boxH / 2)
			.attr('width', boxW)
			.attr('height', boxH)
			.attr('rx', 0) // corner radius x
			.attr('ry', 0) // corner radius y
			.style('stroke', function(d) {
				var gender = String(d.data.gender).toLowerCase();
				if (gender === 'female') {
					return 'hotpink';
				} else if (gender === 'male') {
					return 'steelblue';
				}
				return '#888';
			});

		// Add labels for the nodes
		nodeEnter
			.append('text')
			.classed('node-name', true)
			.attr('dy', function(d) {
				// shift it to vertically middle if alone
				return d.data.spouse ? '-.2em' : '.35em';
			})
			.attr('text-anchor', 'middle')
			.text(function(d) {
				return d.data.name;
			});

		// Add spouse name next to tree's member
		nodeEnter
			.filter(function(d) {
				return !!d.data.spouse;
			})
			.append('text')
			.classed('spouse-name', true)
			.attr('dy', '1em')
			.attr('text-anchor', 'middle')
			.text(function(d) {
				return '⚭' + d.data.spouse.name;
			});

		// Add expand indicator
		nodeEnter
			.filter(function(d) {
				return !!d._children;
			})
			.append('text')
			.classed('expand-icon', true)
			.attr('text-anchor', 'middle')
			.attr('cursor', 'pointer')
			.attr('x', boxW / 2 + 10)
			.attr('y', function(d) {
				return d.children ? -5 : 4;
			})
			.text(function(d) {
				return d.children ? '⊖' : '⊕';
			});

		// UPDATE
		var nodeUpdate = nodeEnter.merge(node);

		// Transition to the proper position for the node
		nodeUpdate
			.transition()
			.duration(duration)
			.attr('transform', function(d) {
				return 'translate(' + d.y + ',' + d.x + ')';
			});

		// Update the expand / close indicator
		nodeUpdate
			.select('text.expand-icon')
			.attr('y', function(d) {
				return d.children ? -5 : 4;
			})
			.text(function(d) {
				return d.children ? '⊖' : '⊕';
			});

		// Remove any exiting nodes
		var nodeExit = node
			.exit()
			.transition()
			.duration(duration)
			.attr('transform', function() {
				return 'translate(' + source.y + ',' + source.x + ')';
			})
			.remove();

		// On exit reduce the opacity of text labels
		nodeExit.select('text').style('fill-opacity', 1e-6);

		// ****************** links section ***************************
		var connector = elbow;

		// Update the links...
		var link = svg.selectAll('path.link').data(links, function(d) {
			return d.id;
		});

		// Enter any new links at the parent's previous position.
		var linkEnter = link
			.enter()
			.insert('path', 'g')
			.attr('class', 'link')
			.attr('d', function() {
				var o = { x: source.x0, y: source.y0 };
				return connector(o, o);
			});

		// UPDATE
		var linkUpdate = linkEnter.merge(link);

		// Transition back to the parent element position
		linkUpdate
			.transition()
			.duration(duration)
			.attr('d', function(d) {
				return connector(d, d.parent);
			});

		// Remove any exiting links
		link
			.exit()
			.transition()
			.duration(duration)
			.attr('d', function(/*d*/) {
				var o = { x: source.x, y: source.y };
				return connector(o, o);
			})
			.remove();

		// Store the old positions for transition.
		nodes.forEach(function(d) {
			d.x0 = d.x;
			d.y0 = d.y;
		});

		// Creates a curved (diagonal) path from parent to the child nodes
		// eslint-disable-next-line
		function diagonal(s, d) {
			let path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;

			return path;
		}

		// Mind that we are drawing with x & y swapped to turn the tree horizontal
		function elbow(s, d) {
			let hy = (s.y - d.y) / 2;
			return `M${d.y},${d.x} H${d.y + hy} V${s.x} H${s.y}`;
		}

		// Toggle children on click.
		function click(d) {
			if (d.children) {
				d._children = d.children;
				d.children = null;
			} else {
				d.children = d._children;
				d._children = null;
			}
			update(d);
		}
	}
});
