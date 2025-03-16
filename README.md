# ClassAct

A miniplugin for managing CSS classes visually in the WordPress Block Editor. 

### [Download](https://github.com/0aveRyan/classact/releases/download/2.0.0/classact.zip)

https://github.com/user-attachments/assets/9a4b0713-4c6a-464d-b455-00f1120334a2

## Features

- **Visual Token Management**: See and manipulate CSS classes as visual tokens
- **Quick Actions**: One-click operations to copy, sort, and remove classes
- **Enhanced Modal**: Full-featured class management modal with advanced sorting options
- **Keyboard Shortcut**: Press `Alt+C` to quickly manage, copy and clear CSS classes for the selected block
- **Hides Core CSS Field in Advanced Panel**: Hides the Core field using CSS -- easy to see and unhide (or just open the modal)

## Usage

1. Upload and activate the plugin
2. Open the WordPress Block Editor
3. Select any block and navigate to the Advanced panel in the sidebar
4. Use the token field to add, remove, and manage CSS classes

## Key Workflows

### Basic Class Management
- **Add Classes**: Type class names and press Enter or Space
- **Remove Classes**: Click the × on any token or press Backspace
- **Automatic Validation**: Classes are validated to ensure they follow CSS naming rules

### Quick Actions (Inspector Panel)
- **Copy**: Quickly copy all classes to clipboard
- **Sort**: Automatically sort classes alphabetically
- **Clear**: Remove all classes from the block
- **Manage**: Open the full class management modal

### Class Management Modal (`option + c`|`alt + c`)
- **Visual Overview**: See all classes with block info and class count
- **Token Management**: Add/remove with the FormTokenField
- **Direct Text Editing**: Edit classes directly in a text area
- **Advanced Sorting**:
  - **Auto Sort**: Intelligent sorting using best practices
  - **Alpha Sort**: Alphabetical ordering
  - **Length Sort**: Sort by class name length
  - **Block Style to End**: Move WordPress style classes to the end
- **Cleanup Options**:
  - **Clear Custom**: Keep only WordPress style classes (is-style-*)
  - **Clear All**: Remove all classes from the block

## Notes

- The token field validates class names using regex to ensure proper CSS naming conventions
- You can always override validation by using the text input
- WordPress block style classes (`is-style-*`) receive special handling
- All changes sync with the core WordPress class input field

## Keyboard Shortcuts

- `Alt+C`: Open the class management modal for the currently selected block
