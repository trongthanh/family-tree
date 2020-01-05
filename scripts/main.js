/**
 * ©2018 Thanh Tran
 *
 * Initially based on the collapsible tree example: https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd
 */
$(() => {
	const width = window.innerWidth;
	const height = window.innerHeight;
	const duration = 750;
	const boxW = 150;
	const boxH = 30;
	const spouseSpace = 50; // space between 2 spouses box from center

	let data = {
		name: 'Top Level',
	};
	let root;
	let i = 0;

	const linkColors = d3
		.scaleLinear()
		.domain([1, 4, 8])
		.range(['#00441b', '#29851F', '#7EA31E']);

	// append the svg obgect to the body of the page
	// appends a 'group' element to 'svg'
	// moves the 'group' element to the top left margin
	let svg = d3
		.select('#tree')
		.append('svg')
		.attr('width', width)
		.attr('height', height);

	const rectBg = svg
		.append('rect')
		.attr('width', width)
		.attr('height', height)
		.classed('chart-bg', true);

	svg = svg.append('g').attr('class', 'tree-container');

	const zoom = d3
		.zoom()
		.scaleExtent([0.4, 4])
		.on('zoom', () => {
			// console.log('on zoom', d3.event.transform);
			svg.attr('transform', d3.event.transform);
		});

	// this is the correct way to set initial scale and translate
	rectBg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(90, height / 2).scale(1));

	// FIXME: debug
	window.svg = svg;
	window.zoom = zoom;
	window.rectBg = rectBg;
	window.data = data;

	$.get('data/greek-gods.yml').done(dataStr => {
		// console.log(dataStr);
		data = jsyaml.load(dataStr);

		// Assigns parent, children, height, depth
		root = d3.hierarchy(data, d => d.children);
		root.x0 = height / 2;
		root.y0 = 0;

		// Collapse after the second level
		root.children.forEach(collapse);

		update(root);
	});

	// declares a tree layout and assigns the size
	const treemap = d3
		.tree()
		.size([height, width])
		.nodeSize([boxH, boxW])
		.separation(function(a, b) {
			// leave some space for the spouse block
			if (b.data.spouse) {
				if (a.data.spouse) {
					// both a & b has spouse blocks
					return 3.5;
				}
				// only b has spouse block
				return 2.5;
			} else if (a.data.spouse) {
				// only a has spouse block
				return 2.5;
			} else if (a.parent === b.parent) {
				// single siblings are close to save space
				return 1.2;
			}

			//else (single cousins)
			return 2;
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
		const treeData = treemap(root);

		// Compute the new tree layout.
		const nodes = treeData.descendants();
		const links = treeData.descendants().slice(1);
		// console.log('treeData', treeData);

		// Normalize for fixed-depth.
		nodes.forEach(d => {
			d.y = d.depth * 250;
		});

		// ****************** Nodes section ***************************

		// Update the nodes...
		const node = svg.selectAll('g.node').data(nodes, d => d.id || (d.id = ++i));

		// Enter any new modes at the parent's previous position.
		const nodeEnter = node
			.enter()
			.insert('g', ':first-child') // children should be below parents so that the transition looks nicer
			.attr('class', d => (d._children ? 'node node--has-children' : 'node'))
			.attr('transform', () => `translate(${source.y0},${source.x0})`)
			.on('click', click);

		// Add person block
		const personBlock = nodeEnter.append('g').attr('transform', d => {
			return d.data.spouse ? `translate(0, ${-spouseSpace / 2})` : 'translate(0, 0)';
		});

		// Add Rectangle as text box for the nodes
		personBlock
			.append('rect')
			.attr('x', d => (d.data.boxW ? -d.data.boxW / 2 : -boxW / 2))
			.attr('y', -boxH * 0.5)
			.attr('width', d => d.data.boxW || boxW)
			.attr('height', boxH)
			.attr('rx', 0) // corner radius x
			.attr('ry', 0) // corner radius y
			.attr('class', d => {
				const gender = String(d.data.gender).toLowerCase();
				if (gender === 'female') {
					return 'box box--female';
				} else if (gender === 'male') {
					return 'box box--male';
				}
				return 'box';
			})
			.on('mouseover', d => {
				const bio = d3.select('#bio');
				if (d.data.bio) {
					bio.html(`Bio: ${d.data.bio}`);
				} else {
					bio.html('');
				}
			});

		// Add labels for the nodes
		personBlock
			.append('text')
			.classed('node-name', true)
			.attr('dy', '.35em') // shift it to vertically middle
			.attr('text-anchor', 'middle')
			.text(d => d.data.name);

		const nodeHasSpouse = nodeEnter.filter(d => !!d.data.spouse);

		// spouse link
		nodeHasSpouse
			.insert('line', ':first-child')
			.attr('class', 'link')
			.attr('stroke', d => {
				return linkColors(d.depth);
			})
			.attr('x1', 0)
			.attr('y1', -spouseSpace / 2)
			.attr('x2', 0)
			.attr('y2', spouseSpace / 2);

		// Add spouse block
		const spouseBlock = nodeHasSpouse.append('g').attr('transform', `translate(0, ${spouseSpace / 2})`);

		// spouse block
		spouseBlock
			.append('rect')
			.attr('x', d => `${d.data.boxW ? -d.data.boxW / 2 : -boxW / 2}`)
			.attr('y', -boxH * 0.5)
			.attr('width', d => d.data.boxW || boxW)
			.attr('height', boxH)
			.attr('class', d => {
				const gender = String(d.data.gender).toLowerCase();
				// spouse gender is assumedly reversed from main node
				// TODO: pickup gender declared in spouse also
				if (gender === 'female') {
					return 'box box--male';
				} else if (gender === 'male') {
					return 'box box--female';
				}
				return 'box';
			})
			.on('mouseover', d => {
				const spouse = d.data.spouse;
				const bio = d3.select('#bio');
				if (spouse.bio) {
					bio.html(`Bio: ${spouse.bio}`);
				} else {
					bio.html('');
				}
			});

		// spouse text
		spouseBlock
			.append('text')
			.classed('spouse-name', true)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'middle')
			.attr('style', d => {
				const name = d.data.spouse.name || d.data.spouse;
				// auto reduce font size so the long spouse names can fit
				if (name.includes('&')) {
					return 'font-size: 10px';
				}
			})
			.text(d => `⚭${d.data.spouse.name || d.data.spouse}`);

		// Add expand indicator
		nodeEnter
			.filter(d => !!d._children)
			.append('text')
			.classed('expand-icon', true)
			.attr('text-anchor', 'middle')
			.attr('x', boxW / 2 + 10)
			.attr('y', 5) // shift middle
			.attr('visibility', d => (d.children ? 'hidden' : 'visible'))
			.text('⊕');

		// UPDATE
		const nodeUpdate = nodeEnter.merge(node);

		// Transition to the proper position for the node
		nodeUpdate
			.transition()
			.duration(duration)
			.attr('transform', d => `translate(${d.y},${d.x})`);

		// Update the expand / close indicator
		nodeUpdate.selectAll('text.expand-icon').attr('visibility', d => (d.children ? 'hidden' : 'visible'));

		// Remove any exiting nodes
		const nodeExit = node
			.exit()
			.transition()
			.duration(duration)
			.attr('transform', () => `translate(${source.y},${source.x})`)
			.remove();

		// On exit reduce the opacity of text labels
		nodeExit.selectAll('text').style('fill-opacity', 0);

		// ****************** links section ***************************
		const connector = elbow;

		// Update the links...
		const link = svg.selectAll('path.link').data(links, d => d.id);

		// Enter any new links at the parent's previous position.
		const linkEnter = link
			.enter()
			.insert('path', 'g')
			.attr('class', 'link')
			.attr('stroke', d => {
				return linkColors(d.depth);
			})
			.attr('d', () => {
				const o = { x: source.x0, y: source.y0 };
				return connector(o, o);
			});

		// UPDATE
		const linkUpdate = linkEnter.merge(link);

		// Transition back to the parent element position
		linkUpdate
			.transition()
			.duration(duration)
			.attr('d', d => {
				if (d.data.spouse) {
					// move link start (at child) a bit up since it is at new position
					// because of spouse
					return connector({ y: d.y, x: d.x - spouseSpace / 2 }, d.parent);
				}
				return connector(d, d.parent);
			});

		// Remove any exiting links
		link
			.exit()
			.transition()
			.duration(duration)
			.attr('d', () => /*d*/ {
				const o = { x: source.x, y: source.y };
				return connector(o, o);
			})
			.remove();

		// Store the old positions for transition.
		nodes.forEach(d => {
			d.x0 = d.x;
			d.y0 = d.y;
		});

		// pan the tree to center the node
		// NOTE: panning during click doesn't look right, disable for now
		// if (source) {
		// 	rectBg
		// 		.transition()
		// 		.duration(1000)
		// 		.call(zoom.transform, d3.zoomIdentity.translate(width / 2 - source.y, height / 2 - source.x).scale(1));
		// }
	} // end of update()

	// Creates a curved (diagonal) path from parent to the child nodes (UNUSED)
	// eslint-disable-next-line
	function diagonal(s, d) {
		const path = `M ${s.y} ${s.x}
			C ${s.y + (d.y - s.y) * 0.8} ${s.x},
			  ${s.y + (d.y - s.y) * 0.1} ${d.x},
			  ${d.y} ${d.x}`;

		return path;
	}

	// Mind that we are drawing with x & y swapped to turn the tree horizontal
	function elbow(s, d) {
		const hy = (s.y - d.y) / 2;
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
});
