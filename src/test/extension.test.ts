import * as assert from 'assert';
import * as vscode from "vscode";
import * as path from 'path';
import fs from 'fs';
import { CommandEnum, CommandNameEnum, SettingEnum, PositionEnum, extension_name, extension_id, debug_enabled, manual_testing_enabled } from "../extension";

// Test file format: /Test Type/Command Name/command_position_(no)invert_(no)merge_(no)filter.txt
/// enable: boolean
/// position: PositionEnum
/// invert: boolean
/// merge: boolean
/// filter: boolean
/// selections_initial: !{ ( {0,0}, {0,0} ) }
/// selections_expected @{ ( {0,0}, {0,0} ) }
/// text_initial between ### and ###
/// text_expected between %%% and %%%
// Selection groups: {} is a list of all selections, () is a selection, the first {} is the anchor, the second {} is the active

const FILE_SELECTION_REG = /(\/\/[^\n]*)(?:\n*)(?:enable:)([^\n]*)(?:\n*)(?:position:)([^\n]*)(?:\n*)(?:invert:)([^\n]*)(?:\n*)(?:merge:)([^\n]*)(?:\n*)(?:filter:)([^\n]*)(?:\n*)(?:!)([^\n]*)(?:\n*)(?:@)([^\n]*)(?:\n*)(?:###\n)([^#]*)(?:\n###)(?:\n*)(?:%%%\n)([^%]*)(?:\n%%%)/;

// This is the text used in all empty tests
const empty_fixture = "";

// This is the text used in all non-empty tests
const text_fixture = `test = {
    qwerty
    asdfgh
    zxcvbn
}`;

// This is a visual of unmerged/unfiltered selections that get output in the broad tests 
// {({1,6},{1,5}),({0,2},{0,4}),({1,5},{1,6}),({3,6},{2,8}),({1,5},{1,9}),({3,9},{3,10}),({1,8},{1,8}),({1,4},{1,5}),({2,5},{3,8}),({2,5},{3,8}),({1,9},{2,6}),({1,6},{1,5})}
const unmerged_unfiltered_selection_visualization = `te[st)| = {
    [q)|[|[|[w))|)er[)t)|[y
    a[[s)|df|[gh
    zx)cv)|)|b[n)|
}`;

// This is a visual of merged/unfiltered selections that get output in the broad tests
// {({1,9},{1,5}),({0,2},{0,4}),({1,9},{3,8}),({3,9},{3,10}),({1,4},{1,5})}
const merged_unfiltered_selection_visualization = `te[st)| = {
    [q)||[wert)[y
    asdfgh
    zxcv)|b[n]|
}`;

// This is a visual of unmerged/filtered selections that get output in the broad tests
// {({1,6},{1,5}),({0,2},{0,4}),({3,6},{2,8}),({3,9},{3,10}),({1,4},{1,5}),({1,9},{2,6})}
const unmerged_filtered_selection_visualization = `te[st)| = {
    [q)||[w)ert[y
    as)|df|[gh
    zx)cvb[n)|
}`;

// This is a visual of merged/filtered selections that get output in the broad tests
// {({1,9},{1,5}),({0,2},{0,4}),({1,9},{3,8}),({3,9},{3,10}),({1,4},{1,5})}
const merged_filtered_selection_visualization = `te[st)| = {
    [q)||[wert)[y
    asdfgh
    zxcv)|b[n]|
}`;


/**
 * Test function identifier
 * Broad:  Test all command permutations on selections existing on the same line, containing selections, containing cursors, on different lines, out of order, multi-line, containing multiline both entirely and partially, anchor and active on either sides, and mixing single and multi-line
 * Specific0: Test all command permutations on empty document
 * Specific1: Test all command permutations on first position in the document
 * Specific2: Test all command permutations on last position in the document
 * @enum
 */
enum TestTypeEnum {
    broad = "broad",
    specific0 = "specific0",
    specific1 = "specific1",
    specific2 = "specific2"
}

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start tests');
    suiteTeardown(() => {
        vscode.window.showInformationMessage('All tests done!');
    });

    /**
     * Test that unit testing is working
     */
    test('Test suite core works', () => {
        assert.strictEqual(true, true);
    });

    /**
     * Test extension exists
     */
    test('extension exists', async () => {
        const ext = vscode.extensions.getExtension(extension_id);
        assert.ok(ext !== null && ext !== undefined);
    });

    /**
     * Test extension does not start when VSCode starts
     */
    test("extension not loaded by default at start", () => {
        const started = vscode.extensions.getExtension(extension_id)?.isActive;
        assert.equal(started, false);
    });

    /**
     * Test settings exist and are accessible
     */
    test("settings extant", async () => {
        const local_settings = vscode.workspace.getConfiguration(extension_name);
        assert.notStrictEqual(local_settings, undefined);
    });

    /**
     * Make sure manual_testing is disabled :)
     */
    test("manual testing disabled", async () => {
        assert.strictEqual(manual_testing_enabled, false, `manual_testing_enabled: ${manual_testing_enabled}, debug printing: ${debug_enabled}`);
    });

    /**
     * Test each command when disabled
     */
    test("commands do not run when disabled", async () => {
        const enable = false;
        for (const command in CommandNameEnum) {
            await run_empty_test(enable, command as CommandNameEnum);
        }
    });

    /**
     * Test each command when enabled
     */
    test("commands run when enabled on empty doc.", async () => {
        const enable = true;
        for (const command in CommandNameEnum) {
            await run_empty_test(enable, command as CommandNameEnum);
        }
    });

    /**
    * Run each test with all command configuration permutations:
    * position (Active, Anchor, End, Start)
    * invert (True, False)
    * filter (True, False)
    * multiCursorMergeOverlapping (True, False)
    */
    test("after - broad test", async () => {
        await run_test(TestTypeEnum.broad, CommandNameEnum.after);
    });

    test("after - specific test 0", async () => {
        await run_test(TestTypeEnum.specific1, CommandNameEnum.after);
    })

    test("after - specific test 1", async () => {
        await run_test(TestTypeEnum.specific1, CommandNameEnum.after);
    })

    test("after - specific test 2", async () => {
        await run_test(TestTypeEnum.specific2, CommandNameEnum.after);
    })

    test("before - broad test", async () => {
        await run_test(TestTypeEnum.broad, CommandNameEnum.before);
    });

    test("before - specific test 0", async () => {
        await run_test(TestTypeEnum.specific0, CommandNameEnum.before);
    })

    test("before - specific test 1", async () => {
        await run_test(TestTypeEnum.specific1, CommandNameEnum.before);
    })

    test("before - specific test 2", async () => {
        await run_test(TestTypeEnum.specific2, CommandNameEnum.before);
    })

    test("down - broad test", async () => {
        await run_test(TestTypeEnum.broad, CommandNameEnum.down);
    });

    test("down - specific test 0", async () => {
        await run_test(TestTypeEnum.specific0, CommandNameEnum.down);
    })

    test("down - specific test 1", async () => {
        await run_test(TestTypeEnum.specific1, CommandNameEnum.down);
    })

    test("down - specific test 2", async () => {
        await run_test(TestTypeEnum.specific2, CommandNameEnum.down);
    })

    test("up - broad test", async () => {
        await run_test(TestTypeEnum.broad, CommandNameEnum.up);
    });

    test("up - specific test 0", async () => {
        await run_test(TestTypeEnum.specific0, CommandNameEnum.up);
    })

    test("up - specific test 1", async () => {
        await run_test(TestTypeEnum.specific1, CommandNameEnum.up);
    })

    test("up - specific test 2", async () => {
        await run_test(TestTypeEnum.specific2, CommandNameEnum.up);
    })

    /**
    * Update debug environment settings with provided values
    *
    * @param command_id - CommandEnum for specific command
    * @param enable - Enable switch for command
    * @param invert - Invert switch for command
    * @param position - PositionEnum for command
    * @param merge - Merge switch for command
    * @param filter - Filter switch for command
    * @returns promise
    * 
    */
    async function update_settings(command_id: CommandEnum, enable: boolean, invert: boolean, position: PositionEnum, merge: boolean, filter: boolean) {
        const extension_config = vscode.workspace.getConfiguration(command_id);
        await extension_config.update(SettingEnum.enable, enable, true);
        await extension_config.update(SettingEnum.invert, invert, true);
        await extension_config.update(SettingEnum.position, position, true);
        if (command_id !== CommandEnum.after && command_id !== CommandEnum.before) {
            await extension_config.update(SettingEnum.filter, filter, true);
        }

        const editor_section_setting_id = "editor";
        const merge_overlapping_cursor_setting_id = "multiCursorMergeOverlapping";
        await vscode.workspace.getConfiguration(editor_section_setting_id).update(merge_overlapping_cursor_setting_id, merge, true);
        // Always render newline to avoid differences
        const render_final_newline_setting_id = "renderFinalNewline";
        await vscode.workspace.getConfiguration(editor_section_setting_id).update(render_final_newline_setting_id, "on", true);
        return new Promise((resolve) => { resolve("settings_resolved"); });
    }

    /**
    * Get selection array from string
    *
    * @param str - text string of selections
    * @param reverse - Reverse order of selections
    * 
    */
    function configure_selections(str: string, reverse = false): vscode.Selection[] {
        let selections: vscode.Selection[] = [];
        // Strip all whitespace
        str = str.replace(/\s/g, "");

        const SELECTION_REG = /(\([^\)]*\))/g;
        const selection_matches = str.match(SELECTION_REG);
        if (!selection_matches) {
            return selections;
        }

        const NUMBER_REG = /(\d+)/g;
        const POSITION_REGEX = /(\{\d+,\d+\})/g;
        for (let i = 0; i < selection_matches.length; i++) {
            const position_matches = selection_matches[i].match(POSITION_REGEX);
            if (!position_matches) {
                continue;
            }

            const anchor_matches = position_matches[0].match(NUMBER_REG);
            if (!anchor_matches) {
                continue;
            }
            const anchor_position = new vscode.Position(parseInt(anchor_matches[0]), parseInt(anchor_matches[1]));

            const active_matches = position_matches[1].match(NUMBER_REG);
            if (!active_matches) {
                continue;
            }
            const active_position = new vscode.Position(parseInt(active_matches[0]), parseInt(active_matches[1]));
            if (!reverse) {
                selections[i] = new vscode.Selection(anchor_position, active_position);
            } else {
                selections[i] = new vscode.Selection(active_position, anchor_position);
            }
        }
        return selections;
    }

    async function run_empty_test(enable: boolean, command: CommandNameEnum) {
        const command_id = CommandEnum[command as keyof typeof CommandEnum];
        const position: PositionEnum = PositionEnum.end;
        const invert = false;
        const merge = true;
        const filter = true;
        await update_settings(command_id, enable, invert, position, merge, filter);

        const document = await vscode.workspace.openTextDocument({ content: empty_fixture });
        const editor = await vscode.window.showTextDocument(document);
        const range = editor.document.validateRange(new vscode.Range(0, 0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));

        await new Promise(resolve => setTimeout(resolve, 100)); //needed?
        await vscode.commands.executeCommand(command_id);
        await new Promise(resolve => setTimeout(resolve, 100)); //needed?

        const editor2 = await vscode.window.showTextDocument(document);
        const range_new = editor.document.validateRange(new vscode.Range(0, 0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));

        const is_same = range.isEqual(range_new);
        if (enable === true) {
            assert.ok(!is_same, `enabled ${command} should always modify the document`);
        } else {
            assert.ok(is_same, `disabled ${command} should never modify the document`);
        }

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

        return new Promise((resolve) => { resolve("test_resolved"); });
    }

    async function run_test(test_type: TestTypeEnum, command: CommandNameEnum) {
        for (const invert of [true, false]) {
            for (const position in PositionEnum) {
                for (const merge of [true, false]) {
                    for (const filter of [true, false]) {
                        const enable = true;
                        const command_id: CommandEnum = CommandEnum[command as keyof typeof CommandEnum];

                        await update_settings(command_id, enable, invert, position as PositionEnum, merge, filter);

                        const is_destructive: boolean = (command === CommandNameEnum.up || command === CommandNameEnum.down);
                        const invert_string: string = (invert ? "invert" : "noinvert");
                        const merge_string: string = (merge ? "merge" : "nomerge");
                        const filter_string: string = (is_destructive ? (filter ? "_filter" : "_nofilter") : "");
                        const file_name = `${command}_${position}_${invert_string}_${merge_string}${filter_string}.txt`;

                        const test_subdir = ((test_type === TestTypeEnum.broad) ? "broad" : "specific");
                        const text_subsubdir = ((test_type === TestTypeEnum.broad) ? "" : test_type.at(-1)!);

                        const file = path.resolve(__dirname, '../../../tests', test_subdir, text_subsubdir, command, file_name)
                        const file_contents: string = fs.readFileSync(file, { encoding: 'utf-8' });
                        const matches: RegExpMatchArray | null = file_contents.match(FILE_SELECTION_REG);
                        if (matches === null || matches === undefined) {
                            assert.fail(`Test file ${file} does not exist or data could not be read from it.`)
                        }

                        const file_description: string = matches[1];
                        const file_enable: boolean = (matches[2] === "true");
                        const file_position: PositionEnum = matches[3] as PositionEnum;
                        const file_invert: boolean = (matches[4] === "true");
                        const file_merge: boolean = (matches[5] === "true");
                        const file_filter: boolean = (matches[6] === "true");
                        const file_selection_input: vscode.Selection[] = configure_selections(matches[7]);
                        const file_selection_expected: vscode.Selection[] = configure_selections(matches[8]);
                        const file_text_input: string = matches[9];
                        const file_text_expected: string = matches[10];

                        assert.strictEqual(file_enable, enable, `non-equal enabled in ${file}`);
                        assert.strictEqual(file_position, position, `non-equal position in ${file}`);
                        assert.strictEqual(file_invert, invert, `non-equal invert in ${file}`);
                        assert.strictEqual(file_merge, merge, `non-equal merge in ${file}`);
                        // Non-destructive commands always set filter to false, don't check it for them
                        if ((is_destructive && filter_string === "") || (!is_destructive && filter_string !== "")) {
                            assert.strictEqual(file_filter, filter, `non-equal filter in ${file}`);
                        }

                        const document = await vscode.workspace.openTextDocument({ content: file_text_input });
                        const editor = await vscode.window.showTextDocument(document);
                        editor.selections = file_selection_input;

                        await new Promise(resolve => setTimeout(resolve, 100));//needed?
                        await vscode.commands.executeCommand(command_id);
                        await new Promise(resolve => setTimeout(resolve, 100)); //needed?

                        const editor2 = await vscode.window.showTextDocument(document);
                        const selections_new = editor2.selections;
                        const text_new = editor2.document.getText();

                        assert.equal(text_new, file_text_expected, `non-equal modified text for ${file}\nexpected:\n${file_text_expected}\nnew:\n${text_new}`);

                        let are_selections_equal = true;
                        for (let i = 0; i < selections_new.length - 1; i++) {
                            are_selections_equal = selections_new[i].isEqual(file_selection_expected[i]);
                            if (!are_selections_equal) {
                                console.log("sel_new");
                                print_selections(selections_new);
                                console.log("sel_exp");
                                print_selections(file_selection_expected);
                                break;
                            }
                        }
                        assert.ok(are_selections_equal, `non-equal modified selections for ${file}`);

                        // Close the file
                        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                        /*
                        const myFile = document.uri;
                        const tabs: vscode.Tab[] = vscode.window.tabGroups.all.map(tg => tg.tabs).flat();
                        const index = tabs.findIndex(tab => tab.input instanceof vscode.TabInputText && tab.input.uri.path === myFile.path);
                        if (index !== -1) {
                            await vscode.window.tabGroups.close(tabs[index]);
                        }*/
                    }
                }
            }
        }
        return new Promise((resolve) => { resolve("test_resolved"); });
    }

    function print_selections(selections: vscode.Selection[] | readonly vscode.Selection[]) {
        let out: string[] = [];
        for (let selection of selections) {
            out.push("({" + selection.anchor.line + "," + selection.anchor.character + "},{" + selection.active.line + "," + selection.active.character + "})");
        }
        console.log(out.join(', '));
    }
});
