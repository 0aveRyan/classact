# ClassAct 🎭

A lightweight WordPress plugin for visually managing CSS classes in the Block Editor.

![ClassAct Demo](https://github.com/user-attachments/assets/9a4b0713-4c6a-464d-b455-00f1120334a2)

## 📦 [Download](https://github.com/0aveRyan/classact/releases/latest/download/classact.zip) | [Try in WordPress Playground](https://playground.wordpress.net/#%7B%22steps%22%3A%5B%7B%22step%22%3A%22login%22%7D%2C%7B%22step%22%3A%22installPlugin%22%2C%22pluginZipFile%22%3A%7B%22resource%22%3A%22url%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2F0aveRyan%2Fclassact%2Freleases%2Flatest%2Fdownload%2Fclassact.zip%22%7D%7D%2C%7B%22step%22%3A%22activatePlugin%22%2C%22pluginName%22%3A%22ClassAct%22%7D%2C%7B%22step%22%3A%22navigateTo%22%2C%22path%22%3A%22%2Fwp-admin%2Fpost-new.php%3Fpost_type%3Dpage%22%7D%5D%2C%22preferredVersions%22%3A%7B%22php%22%3A%228.2%22%2C%22wp%22%3A%22latest%22%7D%7D)

## ✨ Features

- **🔖 Visual Token Management** - Manipulate CSS classes as visual tokens
- **⚡️ Quick Actions** - Copy, sort, and remove classes with one click
- **🔍 Enhanced Modal** - Full-featured management with advanced sorting options
- **⌨️ Keyboard Shortcut** - Press `alt + c` (or `option + c` on Mac) to quickly access
- **🙈 Core CSS Field Hidden** - Replaces the default field in the Advanced panel

## 🚀 Getting Started

1. Upload and activate the plugin
2. Select any block in the editor
3. Find the token field in the Advanced panel
4. Add, remove, and manage CSS classes visually

## 💡 Key Features

### Inspector Panel
- Add classes by typing and pressing Enter/Space
- Remove classes by clicking × on any token
- Use quick actions: Copy, Sort, Clear, Manage

### Modal Interface (`alt+c` / `option+c`)
- **Token Management** - Add/remove with visual tokens
- **Text Editing** - Edit classes directly in text area
- **Sorting Options**:
  - Auto Sort (intelligent best practices)
  - Alphabetical
  - Length
  - Move block styles to end
- **Cleanup**:
  - Clear custom classes
  - Clear all classes

## 🛠️ Developer Notes

- Class names are validated using regex for proper CSS naming conventions
- WordPress block style classes (`is-style-*`) receive special handling
- Changes sync with the core WordPress class input field

## 🧪 Testing

ClassAct uses PHPUnit for testing critical plugin functionality. The test suite covers:

- Plugin initialization and assets loading
- Automatic update system
- PSR-4 autoloader functionality

### Running Tests

1. Install development dependencies:
   ```bash
   composer install
   ```

2. Set up the WordPress test environment (requires MySQL):
   ```bash
   composer run setup-local-tests
   ```

3. Run the tests:
   ```bash
   composer test
   ```

4. Generate code coverage report:
   ```bash
   composer run test:coverage
   ```

## 🔧 Customization

### `classact_keyboard_shortcut` Filter

Customize the keyboard shortcut:

```php
add_filter('classact_keyboard_shortcut', function($shortcut) {
    return array(
        'modifier' => 'shift',
        'character' => 'c',
    );
});
```

Valid modifiers: `alt`, `ctrl`, `shift`, `meta` (Command on Mac)