/* global $, Handlebars*/

$(document).ready(function() {
	var context;

	$.get('data/trans.yml').done(dataStr => {
		// console.log(dataStr);
		var publicTree = jsyaml.load(dataStr);

		drawTree(publicTree);
	});

	function drawTree(data) {
		context = data;
		// Surname at first
		$('h1').html('The ' + data.name.split(' ').shift() + ' Family');

		var source = $('#person-template').html();
		Handlebars.registerPartial('person', $('#person-template').html());
		Handlebars.registerHelper('isFemale', function(gender, options) {
			// eslint-disable-line eqeqeq
			if (gender === 'female') {
				return options.fn(this);
			} else {
				return options.inverse(this);
			}
		});
		var template = Handlebars.compile(source);
		var html = template(context);
		$('#tree').html(html);

		$('.person').on('click', 'img, .expand', function(e) {
			$(this)
				.siblings('.child')
				.slideToggle();

			// If you want to keep the bios hidden until clicked
			// $(this).siblings(".name-and-bio").find(".bio").slideToggle();

			if ($(this).hasClass('expand')) {
				$(this).fadeToggle();
			} else {
				$(this)
					.siblings('.expand')
					.fadeToggle();
			}
			e.stopPropagation();
		});
	}
});
