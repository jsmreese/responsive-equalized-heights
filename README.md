# Responsive Equalized Heights
for ZURB Foundation

An intuitive, class-based interface for creating responsive equalized element heights within ZURB Foundation.

### Usage

Responsive Equalized Heights is built to work with the grid from Foundation 5. It is untested with earlier versions of Foundation.

Include this project's script in your page *after* Foundation.

```
<script src="path/to/responsive-equalized-heights.js"></script>
```

Then add responsive height classes to any elements that should be equalized. That's all. No container classes, no data attributes, no parent element requirements.

Responsive height classes use this format:

```
<screen_size>-height-<group_name>
```

`screen_size` is any of the Foundation screen sizes: `small`, `medium`, `large`, `xlarge`, or `xxlarge`.

`group_name` is any arbitrary string that will create a valid class name. One or two letters work well (`small-height-a` or `medium-height-aa`), but longer group names are fine (`large-height-I-am-a-long__Group-Name`). `auto` is a reserved group name.

At any screen size, all of the elements in each group will share equalized height.

For full details and examples, see the project site: [http://jsmreese.github.io/responsive-equalized-heights/](http://jsmreese.github.io/responsive-equalized-heights/)