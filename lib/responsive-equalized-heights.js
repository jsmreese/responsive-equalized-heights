(function (window, undefined) {
	"use strict";

	var sizes, sheets, matchers, $, F;
	
	$ = window.jQuery;
	F = window.Foundation;

	// find
	function find(array, callback) {
		var index, max, match;

		index = 0;
		max = array.length;

		if (typeof callback !== "function") {
			match = callback;
			callback = function (item) {
				return item === match;
			};
		}

		while (index < max) {
			if (callback(array[index])) { return array[index]; }
			index += 1;
		}
	}

	// each
	function each(array, callback) {
		var index, max;

		index = 0;
		max = array.length;

		if (!array || !max) { return; }

		while (index < max) {
			if (callback(array[index], index) === false) { return; }
			index += 1;
		}
	}

	// map
	function map(array, callback) {
		var index = 0,
			max = array.length,
			ret = [];

		if (!array || !max) { return ret; }

		while (index < max) {
			ret[index] = callback(array[index], index);
			index += 1;
		}

		return ret;
	}

	// compact
	function compact(array) {
		var ret = [];

		each(array, function (item) {
			if (item) { ret.push(item); }
		});

		return ret;
	}

	// unique
	function unique(array) {
		var ret = [];

		each(array, function (_a) {
			if (!find(ret, _a)) { ret.push(_a); }
		});

		return ret;
	}

	// create matcher
	function createMatcher(size) {
		matchers[size] = new RegExp(" " + size + "\\-height\\-(\\S+)");
	}

	// create sheet
	function createSheet(size) {
		sheets[size] = createStylesheet(F.media_queries[size]);
	}

	// create a style element
	// returns a reference to the created style element's sheet property.
	// accepts a media query applied to the created stylesheet.
	// inspired by http://davidwalsh.name/add-rules-stylesheets
	function createStylesheet(media) {
		var style;

		// create a style element
		style = document.createElement("style");

		// webkit hack
		style.appendChild(document.createTextNode(""));

		if (media) {
			style.setAttribute("media", media);
		}

		// add the style element to the page
		document.head.appendChild(style);

		return style.sheet;
	}

	// delete rules for all responsive-equalized-heights stylesheets
	function deleteRules() {
		each(sizes, function (size) {
			var sheet = sheets[size];

			while (sheet.cssRules.length) {
				sheet.deleteRule(0);
			}
		});
	}

	// insert a rule into a stylesheet
	function insertRule(sheet, rule) {
		sheet.insertRule(rule, sheet.cssRules.length);
	}

	// get array of active screen sizes
	// the current screen size is the last active size in the array
	function getActiveSizes() {
		return compact(map(sizes, function (size) {
			if (matchMedia(F.media_queries[size]).matches) {
				return size;
			}
		}));
	}

	// update stylesheet rules
	function updateRules() {
		deleteRules();
		addRules();
	}

	// create responsive height rules
	function addRules() {
		var cache, activeSizes, $elems, groups;

		// setup groups and element cache
		groups = [];
		cache = {};
		activeSizes = getActiveSizes();

		each(activeSizes, function (size) {
			cache[size] = {};
		});

		// general selector will find all possible matches
		$elems = $('[class*="-height-"]');

		// filter possible matches to find real size groups
		$elems = $elems.filter(function (index, elem) {
			var match;

			each(activeSizes, function (size) {
				var sizeMatch, group;

				sizeMatch = matchers[size].exec(" " + elem.className);

				if (sizeMatch) {
					group = sizeMatch[1];
					
					if (group !== "auto")
						match = true;
	
						// save group name
						groups.push(group);
	
						// cache element under size group
						if (cache[size][group]) {
							cache[size][group] = $(cache[size][group]).add(elem);
						} else {
							cache[size][group] = $(elem);
						}
					}
				}
			});

			return match;
		});

		// create unique list of groups
		groups = unique(groups);

		// process each group
		each(groups, function (group) {
			var $group, groupHeight;

			$group = $();

			// add each cached size group, filtering out those elements that have a size override in any larger active size
			each(activeSizes, function (size, sizeIndex) {
				var largerSizes, $sizeGroup;

				if (cache[size][group]) {
					largerSizes = activeSizes.slice(sizeIndex + 1);
					$sizeGroup = cache[size][group];

					if (largerSizes.length) {
						$sizeGroup = $sizeGroup.filter(function (index, elem) {
							var override;

							each(largerSizes, function (largerSize) {
								override = matchers[largerSize].exec(" " + elem.className);

								if (override) { return false; }
							});

							return !override;
						});
					}

					$group = $group.add($sizeGroup);
				}
			});

			// if there are active elements for this group
			// create rules
			if ($group.length) {
				// find max element height in group
				// use outerHeight to include padding and border because of box-sizing: border-box;
				// add one px to account for zoomed factional pixels
				groupHeight = 1 + Math.max.apply(null, $group.map(function (index, elem) { return $(elem).outerHeight(); }));

				// write CSS rules for active sizes and groups
				each(activeSizes, function (size) {
					insertRule(sheets[size], "." + size + "-height-" + group + " { height: " + groupHeight + "px; }");
				});
			}
		});
	}

	// setup sizes
	sizes = "small medium large xlarge xxlarge".split(" ");

	// setup matcher regexps
	matchers = {};
	each(sizes, createMatcher);

	// setup responsive height stylesheets
	sheets = {};
	each(sizes, createSheet);

	// initialize rules
	addRules();

	// window resize handler
	$(window).on("resize", F.utils.throttle(updateRules, 250));

	// expose to the outside world
	F.responsive_heights = {
		stylesheets: sheets,
		update: updateRules,
		remove: deleteRules
	};
})(this);
