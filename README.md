# ClassAct

A microplugin for acting on Additional CSS classes per-block in the WordPress Editor.

![classact-preview](https://github.com/user-attachments/assets/be2d005e-00fa-41db-b0c9-41042a5f6a05)

The goal of this plugin is simple:
* More easily see Additional CSS classes on a WordPress Block.
* More easily and surgically remove additional CSS class names with a single click.
* Preserves Core text input and stays in sync as you work.

## Usage
1. Upload and Activate Plugin
2. Open the WordPress Block Editor
3. In a Block Sidebar under the Advanced Panel, there is a field to work with CSS classes as tokens instead of a string.

## Notes
* The `<FormTokenField>` uses regex to attempt to limit inputs to valid CSS class names _(i.e., without a period)_. It can always be overridden using the text input above. YMMV.
