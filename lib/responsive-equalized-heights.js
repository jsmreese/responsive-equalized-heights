(function (window, undefined) {
	var sizes, groups, sheets, currentSize;

	// findLast
	function findLast(array, callback) {
		var index

		index = array.length;

		while (index -= 1) {
			if (callback(array[index])) { return array[index]; }
		}
	}

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
			style.setAttribute("media", media)
		}

		// add the style element to the page
		document.head.appendChild(style);
		
		return style.sheet;
	}
	
	// delete rules for all stylesheets
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
	
	// get current screen size
	function getScreenSize() {
		return findLast(sizes, function (size) {
			return matchMedia(Foundation.media_queries[size]).matches;
		});
	}
	
	// get array of active screen sizes
	function getActiveSizes() {
		return sizes.slice(0, _.indexOf(sizes, currentSize) + 1);
	}
	
	sizes = "small medium large xlarge xxlarge".split(" ");
	groups = "a b c d e f g h i j k l m n o p q r s t u v w x y z".split(" ");
	
	// setup responsive height stylesheets
	sheets = {};
	_.each(sizes, function (size) {
		sheets[size] = createStylesheet(Foundation.media_queries[size]);
	});

DDK.initStylesheets = function () {
	var groupHeights, addRules;
	
	groupHeights = function () {
		var cache, activeSizes, $blocks;
		
		cache = {};
		
		activeSizes = getActiveSizes();
		$blocks = $(".block");
		
		each(activeSizes, function (size) {
			cache[size] = {};
		});

		// cache size-group selections for all active sizes
		each(groups, function (group) {
			each(activeSizes, function (size) {
				var selector, $elems;
				
				// select the current size-group, e.g. medium-height-c
				selector = "." + size + "-height-" + group;
				
				$elems = $blocks.filter(selector);
				
				if ($elems.length) {
					// cache selection
					cache[size][group] = $elems;
				}
			});
		});
		
		// create size-groups for current size
		each(groups, function (group) {
			var largerSizes, smallerSizes, $group, $smaller, sizeIndex, groupHeight;
			
			sizeIndex = _.indexOf(activeSizes, currentSize);
			largerSizes = activeSizes.slice(sizeIndex + 1); // should be sizes.slice?
			smallerSizes = activeSizes.slice(0, sizeIndex);
			
			// get current size-group from cache
			$group = $().add(cache[currentSize][group]);

			// filter $group elements for *larger* size overrides from all active sizes
			// search element class list for classes that start with <largerSize>-height-
			// can't do a jQuery :not([class*='...']) attribute filter here
			// because large-* would also match xlarge-* and xxlarge-*
			if ($group.length) {
				each(largerSizes, function (largerSize) {
					$group = $group.filter(function (index, elem) {
						// return those that do not have a larger class override
						return !find(elem.classList, function (className) {
							return _.string.startsWith(className, largerSize + "-height-");
						});
					});
				});
			}
			
			// add all smaller size-groups
			$smaller = $();
			each(smallerSizes, function (smallerSize) {
				$smaller = $smaller.add(cache[smallerSize][group]);
			});
			
			// filter $smaller elements for size overrides from all active sizes
			// find the size of the matched group then filter for any larger size overrides
			// can't do a jQuery :not([class*='...']) attribute filter here
			// because large-* would also match xlarge-* and xxlarge-*
			if ($smaller.length) {
				$smaller = $smaller.filter(function (index, elem) {
					var classList, matchSize, overrideSizes;

					classList = elem.classList;
					matchSize = find(classList, function (className) {
						return _.string.endsWith(className, "-height-" + group);
					}).split("-")[0];
					overrideSizes = activeSizes.slice(_.indexOf(sizes, matchSize) + 1);
					
					// return elements that *don't* have a larger class overriding the matched group
					return !find(classList, function (className) {
						return _.any(overrideSizes, function (overrideSize) {
							return _.string.startsWith(className, overrideSize + "-height-");
						});
					});
				});
			}
			
			$group = $group.add($smaller);

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
	};
	
	addRules = function () {
		var activeSizes, $blocks;

		activeSizes = getActiveSizes();
		$blocks = $(".block");
		
		groupHeights();
	};
	

	
	// initialize rules
	//addRules();
	

};

	// window resize handler
	$(window).on("resize", Foundation.utils.throttle(function () {
		// save new screen size
		currentSize = getScreenSize();
		
		// update stylesheet rules
		deleteRules();
		addRules();
	}, 250));

})(this);
		
