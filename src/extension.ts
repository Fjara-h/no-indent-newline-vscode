"use strict";
import * as vscode from 'vscode';

const author_name = `fjara`;
const extension_title = `No Indent Newline`;
export const extension_name = `no-indent-newline`;
export const extension_id = `${author_name}.${extension_name}`;
const extension_url = `https://github.com/Fjara-h/no-indent-newline-vscode`;

const extension_major_version = 1;
const extension_minor_version = 0;
const extension_revision_version = 1;
const extension_version = `${extension_major_version}.${extension_minor_version}.${extension_revision_version}`;

export const debug_enabled = false;
export const manual_testing_enabled = false;

const editor_section_setting_id = `editor`;
const merge_overlapping_cursor_setting_id = `multiCursorMergeOverlapping`;

/** Icon generation
 * Import icon.svg to Krita at 100ppi
 ** If the background is black:
 ** Convert to paint later
 ** Filter -> HSV adjustment -> +15 Lightness
 * Export as icon.png loseless compression
 */

/**
 * Extension command name
 * @enum
 */
export enum CommandNameEnum {
    before = `before`,
    up = `up`,
    down = `down`,
    after = `after`
}

/**
 * Extension command identifier accessed by CommandNameEnum
 * @enum
 */
export enum CommandEnum {
    before = `${extension_name}.${CommandNameEnum.before}`,
    up = `${extension_name}.${CommandNameEnum.up}`,
    down = `${extension_name}.${CommandNameEnum.down}`,
    after = `${extension_name}.${CommandNameEnum.after}`
}

/**
 * Extension setting names
 * @enum
 */
export enum SettingEnum {
    enable = `enable`,
    invert = `invert`,
    position = `position`,
    filter = `filter`
}

/**
 * VSCode selection position names
 * @enum
 */
export enum PositionEnum {
    active = `active`,
    anchor = `anchor`,
    start = `start`,
    end = `end`
}

/**
 * VSCode selection position complement names
 * @enum
 */
export enum PositionComplementEnum {
    active = `anchor`,
    anchor = `active`,
    start = `end`,
    end = `start`
}

/**
 * @typedef {Object} CommandSettings - per command_id settings object
 * @property {string} enable - a string property for if a command is enabled
 * @property {string} invert - a string property for if a command has inverted output
 * @property {string} position - a string property for the selection position to use by a command
 * @property {string} filter - a string property for if a command has filtered selections
 */
export type CommandSettings = {
    [SettingEnum.enable]: boolean,
    [SettingEnum.invert]: boolean,
    [SettingEnum.position]: PositionEnum,
    [SettingEnum.filter]: boolean,
}

// Default command settings to provide initial state for package.json and default fallback for lookup failure
export const CommandSettingsDefault: Record<string, CommandSettings> = {
    [CommandEnum.before]: {
        [SettingEnum.enable]: true,
        [SettingEnum.invert]: false,
        [SettingEnum.position]: PositionEnum.end,
        [SettingEnum.filter]: false
    },
    [CommandEnum.up]: {
        [SettingEnum.enable]: true,
        [SettingEnum.invert]: false,
        [SettingEnum.position]: PositionEnum.end,
        [SettingEnum.filter]: false,
    },
    [CommandEnum.down]: {
        [SettingEnum.enable]: true,
        [SettingEnum.invert]: false,
        [SettingEnum.position]: PositionEnum.end,
        [SettingEnum.filter]: false,
    },
    [CommandEnum.after]: {
        [SettingEnum.enable]: true,
        [SettingEnum.invert]: false,
        [SettingEnum.position]: PositionEnum.end,
        [SettingEnum.filter]: false
    }
};

/**
   * A promise that will resolve when this extension has been activated
   *
   * @param context - provided by vscode
   */
export function activate(context: vscode.ExtensionContext) {
    /**
     * @summary
     * Non-destructively insert non-indented newline on the line above the selection position.
     * Command: no-indent-newline.before
     * Settings:
     * `no-indent-newline.before.enable`
     * `no-indent-newline.before.invert`
     * `no-indent-newline.before.position`
     * `no-indent-newline.before.filter`
     */
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(CommandEnum.before, function (editor) {
        run_command_scaffolding(editor, CommandEnum.before);
    }));

    /**
     * @summary
     * Destructively insert non-indented newline on the line above the selection position.
     * Command: no-indent-newline.up
     * Settings:
     * `no-indent-newline.up.enable`
     * `no-indent-newline.up.invert`
     * `no-indent-newline.up.position`
     * `no-indent-newline.up.filter`
     */
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(CommandEnum.up, function (editor) {
        run_command_scaffolding(editor, CommandEnum.up);
    }));

    /**
     * @summary
     * Destructively insert non-indented newline on the line below the selection position.
     * Command: no-indent-newline.down
     * Settings:
     * `no-indent-newline.down.enable`
     * `no-indent-newline.down.invert`
     * `no-indent-newline.down.position`
     * `no-indent-newline.down.filter`
     */
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(CommandEnum.down, function (editor) {
        run_command_scaffolding(editor, CommandEnum.down);
    }));

    /**
     * @summary
     * Non-destructively insert non-indented newline on the line below the selection position.
     * Command: no-indent-newline.after
     * Settings:
     * `no-indent-newline.after.enable`
     * `no-indent-newline.after.invert`
     * `no-indent-newline.after.position`
     * `no-indent-newline.after.filter`
     */
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(CommandEnum.after, function (editor) {
        run_command_scaffolding(editor, CommandEnum.after);
    }));
}

/**
   * Logic for all four insert newline commands
   *
   * @param editor - TextEditor from the registerTextEditorCommand callback
   * @param command_id - string as keyof typeof CommandEnum
   * @returns - boolean depedant if input exists or not
   * 
   */
async function run_command_scaffolding(editor: vscode.TextEditor, command_id: CommandEnum) {
    if (debug_enabled && manual_testing_enabled) {
        print_selections(editor.selections);
        console.log(editor.selections);
        if (await manual_testing(editor, command_id) === `initialized_manual_testing`) {
            return;
        }
        print_selections(editor.selections);
        console.log(editor.selections);
    }

    const ext_settings: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(extension_name);

    const command_name: CommandNameEnum = CommandNameEnum[command_id.split(`.`)[1] as keyof typeof CommandNameEnum];

    const is_enabled: boolean = ext_settings.get(`${command_name}.${SettingEnum.enable}`, CommandSettingsDefault[command_id][SettingEnum.enable]);
    const is_merge: boolean = vscode.workspace.getConfiguration(editor_section_setting_id).get(merge_overlapping_cursor_setting_id, false);

    if (is_enabled && is_extant(editor.selections)) {
        const position_type: PositionEnum = ext_settings.get(`${command_name}.${SettingEnum.position}`, CommandSettingsDefault[command_id][SettingEnum.position]);
        const is_inverted: boolean = ext_settings.get(`${command_name}.${SettingEnum.invert}`, CommandSettingsDefault[command_id][SettingEnum.invert]);
        const is_postfix: boolean = (command_id === CommandEnum.after || command_id === CommandEnum.down);
        const is_destructive: boolean = (command_id === CommandEnum.up || command_id === CommandEnum.down);
        const is_filtered: boolean = is_destructive ? ext_settings.get(`${command_name}.${SettingEnum.filter}`, CommandSettingsDefault[command_id][SettingEnum.filter]) : false;

        const selections_to_use: readonly vscode.Selection[] = (is_filtered ? filter_invalid_overlapping_ranges(editor.selections) : editor.selections);

        print_selections(selections_to_use);

        const selections_sorted_index: { index: number; selection: vscode.Selection; }[] = get_sorted_selections(selections_to_use, position_type);
        const selections_sorted: vscode.Selection[] = selections_sorted_index.map(a => a.selection);
        const map_sorted_to_unsorted: number[] = selections_sorted_index.map(a => a.index);

        interface selection_clump {
            selection: vscode.Selection;
            owner_index: number;
        }
        let clumps: selection_clump[] = [];

        let selections_new: vscode.Selection[] = Array.from({ length: selections_to_use.length });
        let text_new: { position: vscode.Position, text: string }[] = [];

        let document_line_delta: Record<number, number> = {};
        let line_counter = 0;

        editor.edit(edit => {
            for (const [index, selection] of selections_sorted.entries()) {
                // Tally deleted new lines at each delta location to calculate modified cursor location
                if (is_destructive && !selection.isSingleLine) {
                    for (let i = selection.start.line; i < selection.end.line; i++) {
                        if (!is_extant(document_line_delta[i])) {
                            line_counter++;
                            document_line_delta[i] = line_counter;
                        }
                    }
                }

                // Calculate new cursor locations - then adjusted for destructive actions removing newlines in multline selections
                let new_line_number = selection[position_type].line + index + (is_postfix ? 1 : 0);
                if (is_destructive) {
                    // Find the first line delta before position's line as that contains how many lines have been removed
                    for (let i = selection[position_type].line - 1; i > 0; i--) {
                        if (is_extant(document_line_delta[i])) {
                            new_line_number -= document_line_delta[i];
                            break;
                        }
                    }
                }

                // Todo: Is it possible to calculate/set the REAL final location including the inversion here without being expensive  - do I insertit insert at pos (if normal) or pos minus number of selections on line that gets calculated over duration of loop
                // Calculated final* locations for new cursors - *inverted order not applied yet
                const selection_position_new: vscode.Position = new vscode.Position(new_line_number, 0);
                selections_new[index] = new vscode.Selection(selection_position_new, selection_position_new);

                // Todo: Is it possible to calculate/set the REAL final location including the inversion here without being expensive
                // Calculated final* location for text insertion location  - *inverted order not applied yet
                const position_line = selection[position_type].line;
                const position_line_end_char = editor.document.lineAt(position_line).range.end.character; //?  Illegal value for `line` in lineAT
                text_new[index] = { position: new vscode.Position(position_line, (is_postfix ? position_line_end_char : 0)), text: `\n` };

                if (is_destructive && (is_merge || (!is_merge && is_filtered))) {
                    clumps.push({ selection: selection, owner_index: index, });
                } else if (is_destructive && !is_merge && !is_filtered) {
                    let new_clump: selection_clump = {
                        selection: selection,
                        owner_index: index
                    };

                    // If the current selection intersects with any clump, they will be merged
                    let clumps_to_merge: number[] = [];
                    for (const [i, clump] of clumps.entries()) {
                        const clump_intersection = clump.selection.intersection(selection);
                        if (is_extant(clump_intersection)) {
                            clumps_to_merge.push(i);
                        }
                    }

                    // Calculate merged clump range and its sorted owner index
                    for (let i = 0; i < clumps_to_merge.length; i++) {
                        const clump = clumps[clumps_to_merge[i]];
                        const clump_end_comp_merged: number = clump.selection.end.compareTo(new_clump.selection.end);
                        const clump_start_comp_merged: number = clump.selection.start.compareTo(new_clump.selection.start);
                        const clump_index_less_merged: boolean = map_sorted_to_unsorted[clump.owner_index] < map_sorted_to_unsorted[new_clump.owner_index];
                        if (clump_end_comp_merged > 0) {
                            new_clump.selection = new vscode.Selection(new_clump.selection.start, clump.selection.end);
                            new_clump.owner_index = clump.owner_index;
                        } else if (clump_end_comp_merged === 0 && clump_start_comp_merged === 0 && clump_index_less_merged) {
                            new_clump.owner_index = clump.owner_index;
                        }

                        if (clump_start_comp_merged < 0) {
                            new_clump.selection = new vscode.Selection(clump.selection.start, new_clump.selection.end);
                            if (clump_end_comp_merged === 0 && clump_index_less_merged) {
                                new_clump.owner_index = clump.owner_index;
                            }
                        }
                    }

                    // Todo: Is there a cleaner way to do this
                    // Remove each merged clump from clumps
                    clumps = clumps.filter(function (_, index) {
                        return !(clumps_to_merge.find((clump_index) => clump_index === index));
                    });
                    clumps.push(new_clump);
                }
            }

            // Processing clump ranges and text ownership - clumps only has values when is_destructive
            for (const [index, clump] of clumps.entries()) {
                const next_clump = clumps[index + 1];
                let line_end_character = editor.document.lineAt(clump.selection.end.line).range.end.character;
                if (is_extant(next_clump) && clump.selection.end.line === next_clump.selection.start.line) {
                    line_end_character = next_clump.selection.start.character;
                }
                const text_range = new vscode.Selection(clump.selection.end.line, clump.selection.end.character, clump.selection.end.line, line_end_character);
                const text_content = editor.document.getText(text_range) || ``;
                if (!text_range.isEmpty) {
                    for (const range of split_selection_by_line(text_range, editor)) {
                        edit.replace(range, ``);
                    }
                }

                const new_text_pos = new vscode.Position(
                    selections_sorted[clump.owner_index][position_type].line,
                    (is_postfix ? editor.document.lineAt(selections_sorted[clump.owner_index][position_type].line).range.end.character : 0)
                );
                text_new[clump.owner_index] = {
                    position: new_text_pos,
                    text: (is_postfix ? `\n${text_content}` : `${text_content}\n`)
                };
                if (!clump.selection.isEmpty) {
                    for (const range of split_selection_by_line(clump.selection, editor)) {
                        edit.replace(range, ``);
                    }
                }
            }

            // Todo: MAKE IT BETTER
            if (!is_inverted) {
                let start_of_line_index = 0;
                let current_line = 0;
                // Inversion flips the selections and text of everything on the same line
                for (let i = 0; i < selections_sorted.length; i++) {
                    const next_selection = selections_sorted[i + 1];
                    if (!is_extant(next_selection) || next_selection[position_type].line !== current_line) {
                        if (i + 1 - start_of_line_index > 1) {
                            selections_new.splice(start_of_line_index, i + 1 - start_of_line_index, ...selections_new.slice(start_of_line_index, i + 1).toReversed());
                            text_new.splice(start_of_line_index, i + 1 - start_of_line_index, ...text_new.slice(start_of_line_index, i + 1).toReversed());
                        }
                        start_of_line_index = i + 1;
                        current_line = is_extant(next_selection) ? next_selection[position_type].line : -1;
                    }
                }
            }

            // Remap selections from sorted to the unsorted original ordering
            selections_new = selections_new.map((_: vscode.Selection, i: number) => {
                return selections_new[map_sorted_to_unsorted.indexOf(i)];
            });

            // Todo: Check if this is needed at all
            // Remap text from sorted to the unsorted ordering
            text_new = text_new.map((_: {}, i: number) => {
                return text_new[map_sorted_to_unsorted.indexOf(i)];
            });

            for (const { position, text } of text_new) {
                if (is_extant(position) && is_extant(text)) {
                    edit.insert(position, text);
                }
            }
        });

        editor.selections = selections_new;
    }
    print_selections(editor.selections);
}

/**
   * Effectively !isNullOrUndefined
   *
   * @param val - variable to test for null or undefined
   * @param boolean - string as keyof typeof PositionEnum
   * @returns - boolean depedant if input exists or not
   * 
   */
function is_extant(val: any): boolean {
    if ((val === null) || (val === undefined)) {
        return false;
    }
    return true;
}

/**
   * Sorts array of selections by position, if equal, then its complement, and if equal again, its original index
   * VSCode does not sort in the exact same way, so it may differ.
   *
   * @param selections - Array of selections given by command register callback
   * @param position - string as keyof typeof PositionEnum
   * @returns - selections sorted based on the provided position.
   * 
   */
function get_sorted_selections(selections: readonly vscode.Selection[], position: PositionEnum): { index: number; selection: vscode.Selection; }[] {
    return selections.map((selection, index) => ({ index: index, selection: selection })).toSorted(
        (a, b) => {
            const preferred_position_comparison = a.selection[position].compareTo(b.selection[position]);
            if (preferred_position_comparison !== 0) {
                return preferred_position_comparison;
            }
            const secondary_position_comparison = a.selection[PositionComplementEnum[position]].compareTo(b.selection[PositionComplementEnum[position]]);
            if (secondary_position_comparison !== 0) {
                return secondary_position_comparison;
            }
            return (a.index - b.index);
        }
    );
}

/**
   * Splits input selection into into individual lines and line-ends to avoid overlaps
   *
   * @param selection - any selection
   * @param editor - TextEditor from the registerTextEditorCommand callback
   * @returns - selections consistenting of all ranges contained input
   * 
   */
function split_selection_by_line(selection: vscode.Selection, editor: vscode.TextEditor): vscode.Selection[] {
    if (selection.isSingleLine) {
        return [selection];
    }

    let selections: vscode.Selection[] = [];
    for (let line = selection.start.line; line <= selection.end.line; line++) {
        const line_start = new vscode.Position(line, 0);
        if (line === selection.end.line) {
            selections.push(new vscode.Selection(line_start, selection.end));
        } else {
            const textline = editor.document.lineAt(line);
            const line_end: vscode.Position = textline.range.end;
            const linebreak_end: vscode.Position = textline.rangeIncludingLineBreak.end;
            if (line === selection.start.line) {
                selections.push(new vscode.Selection(selection.start, line_end));
            } else {
                selections.push(new vscode.Selection(line_start, line_end));
            }
            selections.push(new vscode.Selection(line_end, linebreak_end));
        }
    }

    return selections;
}

/**
   * Removes selections or ranges that overlap exactly how VSCode works for similar functions.
   *
   * @param selections Array of selections given by command register callback
   * @returns - Selections with overlapping selections filtered out while maintaining original order
   * 
   */
function filter_invalid_overlapping_ranges(selections: readonly vscode.Selection[]): vscode.Selection[] {
    const selections_sorted_index = get_sorted_selections(selections, PositionEnum.end);
    const selections_sorted: vscode.Selection[] = selections_sorted_index.map(a => a.selection);
    const map_sorted_to_unsorted: number[] = selections_sorted_index.map(a => a.index);

    for (let i = selections_sorted.length - 2; i >= 0; i--) {
        const prev = i + 1;
        const curr = i;
        if (selections_sorted[prev].start.isBefore(selections_sorted[curr].end)) {
            const removal_index = (map_sorted_to_unsorted[prev] > map_sorted_to_unsorted[curr]) ? prev : curr;
            selections_sorted.splice(removal_index, 1);
            map_sorted_to_unsorted.splice(removal_index, 1);
            selections_sorted_index.splice(removal_index, 1);
        }
    }

    let return_selections = [];
    for (const [i, v] of selections_sorted_index.entries()) {
        return_selections[v.index] = v.selection;
    }

    return return_selections.filter(Boolean);
}

/**
   * Required by VSCode to deactivate extension 
   */
export function deactivate() { }

/**
   * Debugging: Print selection aray to console in the format {({#,#},{#,#})}
   *
   * @param selections - Array of selections
   * 
   * @internal
   */
function print_selections(selections: vscode.Selection[] | readonly vscode.Selection[]) {
    if (debug_enabled) {
        let str: string[] = [];
        for (let selection of selections) {
            str.push(`({${selection.anchor.line},${selection.anchor.character}},{${selection.active.line},${selection.active.character}})`);
        }
        console.log(str.join(`, `));
    }
}

/**
   * Debugging: Configures settings and text editor - text and selections
   *
   * @param editor - TextEditor from the registerTextEditorCommand callback
   * @param command_id - string as keyof typeof CommandEnum
   * 
   * @internal
   * 
   */
async function manual_testing(editor: vscode.TextEditor, command_id: CommandEnum): Promise<string> {
    if (!debug_enabled && !manual_testing_enabled) {
        return new Promise((resolve) => { resolve(`not_running_manual_testing`); });
    }

    // Note, user __must__ copy and paste text_fixture into the document manually otherwise before running command.
    // Set selection_fixture, text_fixture, enable, position, invert, merge, filter

    const selection_fixture_full: vscode.Selection[] = [
        new vscode.Selection(1, 6, 1, 5),
        new vscode.Selection(0, 2, 0, 4),
        new vscode.Selection(1, 5, 1, 6),
        new vscode.Selection(3, 6, 2, 8),
        new vscode.Selection(1, 5, 1, 9),
        new vscode.Selection(3, 9, 3, 10),
        new vscode.Selection(1, 8, 1, 8),
        new vscode.Selection(1, 4, 1, 5),
        new vscode.Selection(2, 5, 3, 8),
        new vscode.Selection(2, 5, 3, 8),
        new vscode.Selection(1, 9, 2, 6),
        new vscode.Selection(1, 6, 1, 5)
    ];
    const selection_fixture_start: vscode.Selection[] = [
        new vscode.Selection(0, 0, 0, 0)
    ];
    const selection_fixture_end: vscode.Selection[] = [
        new vscode.Selection(0, 0, 0, 0)
    ];
    const selection_fixture = selection_fixture_full;

    const text_fixture_full = `test = {
    qwerty
    asdfgh
    zxcvbn
}`;
    const text_fixture_empty = ``;
    const text_fixture = text_fixture_full;

    const enable = true;
    //const enable = false;

    const position = `active`;
    //const position = `anchor`;
    //const position = `end`;
    //const position = `start`;

    const invert = false;
    //const invert = true;

    const merge = true;
    //const merge = false;

    //const filter = false;
    const filter = true;

    await vscode.workspace.getConfiguration(command_id).update(SettingEnum.enable, enable, true);
    await vscode.workspace.getConfiguration(command_id).update(SettingEnum.invert, invert, true);
    await vscode.workspace.getConfiguration(command_id).update(SettingEnum.position, position, true);
    if (command_id !== CommandEnum.after && command_id !== CommandEnum.before) {
        await vscode.workspace.getConfiguration(command_id).update(SettingEnum.filter, filter, true);
    }
    await vscode.workspace.getConfiguration(editor_section_setting_id).update(merge_overlapping_cursor_setting_id, merge, true);

    let is_selections_equal = true;
    if (editor.selections.length !== selection_fixture.length) {
        is_selections_equal = false;
    } else {
        for (let i = 0; i < editor.selections.length; i++) {
            if (!editor.selections[i].isEqual(selection_fixture[i])) {
                is_selections_equal = false;
                break;
            }
        }
    }

    // Not a great condition way to do this.
    if (editor.document.getText() === text_fixture && (!is_selections_equal || editor.selections.length > 1)) {
        editor.selections = selection_fixture;
        return new Promise((resolve) => { resolve(`initialized_manual_testing`); });
    } else {
        const command_name: CommandNameEnum = CommandNameEnum[command_id.split(`.`)[1] as keyof typeof CommandNameEnum];
        const inv_t = (invert) ? `invert` : `noinvert`;
        const merge_t = (merge) ? `merge` : `nomerge`;
        const filter_t = (filter) ? `_filter` : `_nofilter`;
        console.log(`${command_name}_${position}_${inv_t}_${merge_t}${filter_t}`);
        return new Promise((resolve) => { resolve(`skipping_initialize_to_run_scaffold`); });
    }
}
