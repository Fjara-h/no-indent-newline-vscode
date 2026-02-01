# no-indent-newline
Adds four (4) commands which add a newline that ignores automatic indentation. Handles multi-cursor selections.

## Features
### Insert Non-Indented Newline Before
* Command Palette Name: `Insert Non-Indented Newline Before`
* Command Name: `no-indent-newline.before`
* Linux default keybind: `Ctrl + Shift + Alt + Meta + Enter`
* Windows default  keybind: `Ctrl + Shift + Alt + Win + Enter`
* Mac default keybind: `Cmd + Shift + Alt + Meta + Enter`
* Default when condition: `editorTextFocus && !editorReadonly && config.no-indent-newline.[command_name].enable`
### Insert Non-Indented Newline Up
* Command Palette Name: `Insert Non-Indented Newline Up`
* Command Name: `no-indent-newline.up`
* Linux default keybind: `Ctrl + Alt + Meta + Enter`
* Windows default  keybind: `Ctrl + Alt + Win + Enter`
* Mac default keybind: `Cmd + Alt + Meta + Enter`
* Default when condition: `editorTextFocus && !editorReadonly && config.no-indent-newline.[command_name].enable`
### Insert Non-Indented Newline Down
* Command Palette Name: `Insert Non-Indented Newline Down`
* Command Name: `no-indent-newline.down`
* Linux default keybind: `Ctrl + Meta + Enter`
* Windows default  keybind: `Ctrl + Win + Enter`
* Mac default keybind: `Cmd + Meta + Enter`
* Default when condition: `editorTextFocus && !editorReadonly && config.no-indent-newline.[command_name].enable`
### Insert Non-Indented Newline After
* Command Palette Name: `Insert Non-Indented Newline After`
* Command Name: `no-indent-newline.after`
* Linux default keybind: `Ctrl + Shift + Meta + Enter`
* Windows default  keybind: `Ctrl + Shift + Win + Enter`
* Mac default keybind: `Cmd + Shift + Meta + Enter`
* Default when condition: `editorTextFocus && !editorReadonly && config.no-indent-newline.[command_name].enable`

## Settings
### Before
* `no-indent-newline.before.enable` : `true` : Enables the command and keybind to insert a non-indented newline on the previous line.
* `no-indent-newline.before.invert` : `false` : Invert the default ordering - With multiple selections on the same line, the left-most selection is placed at the bottom.
* `no-indent-newline.before.position` : `end` : Selection position to compare and use as the focal point of calculations. Start, Active, Anchor, End.
### Up
* `no-indent-newline.up.enable` : `true` : Enables the command and keybind to insert a non-indented newline on the previous line deleting the selection and moving text after it, with it.
* `no-indent-newline.up.invert` : `false` : Invert the default ordering - With multiple selections on the same line, the left-most selection is placed at the bottom.
* `no-indent-newline.up.position` : `end` : Selection position to compare and use as the focal point of calculations. Start, Active, Anchor, End.
* `no-indent-newline.up.filter` : `false` : Filter selections similar to how VSCode does before doing operations.
### Down
* `no-indent-newline.down.enable` : `true` : Enables the command and keybind to insert a non-indented newline on the next line deleting the selection and moving text after it, with it.
* `no-indent-newline.down.invert` : `false` : Invert the default ordering - With multiple selections on the same line, the left-most selection is placed at the top.
* `no-indent-newline.down.position` : `end` : Selection position to compare and use as the focal point of calculations. Start, Active, Anchor, End.
* `no-indent-newline.down.filter` : `false` : Filter selections similar to how VSCode does before doing operations.
### After
* `no-indent-newline.after.enable` : `true` : Enables the command and keybind to insert a non-indented newline on the next line.
* `no-indent-newline.after.invert` : `false` : Invert the default ordering - With multiple selections on the same line, the left-most selection is placed at the top.
* `no-indent-newline.after.position` : `end` : Selection position to compare and use as the focal point of calculations. Start, Active, Anchor, End.

# Roadmap:
* Optimize?
    - Calculate final (not-yet-inverted) locations for new cursors in edit rather than post edit if(!is_inverted) condition
    - If not above, then make that conditional block less wonky
    - Removing merged clumps
    - text_new remapping?
* Rename for clarity to remove ambiguity - "invert"
* Any open issues...
