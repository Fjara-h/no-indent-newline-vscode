"use strict";
import * as path from 'path';
import fs from 'fs';

// Set this to true if not actively using it to avoid overwrites
const dry_run = true;

// #L4
const author_name = `fjara`;
const extension_title = `No Indent Newline`;
const extension_name = `no-indent-newline`;
const extension_id = `${author_name}.${extension_name}`;
const extension_url = `https://github.com/Fjara-h/no-indent-newline-vscode`;

const extension_major_version = 1;
const extension_minor_version = 0;
const extension_revision_version = 1;
const extension_version = `${extension_major_version}.${extension_minor_version}.${extension_revision_version}`;
// #L13

// #L29
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

/* Default command settings to provide initial state for package.json and default fallback for lookup failure */
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
// #L124

const COMMAND_NAME_REG = /\[command_name\]/gi;
const META_REG = /Meta/gi;
const CTRL_REG = /Ctrl/gi;
const IS_POSTFIX_REG = /\[is_postfix\]/gi;
const IS_DESTRUCTIVE_REG = /\[is_destructive\]/gi;

const when_condition = `editorTextFocus && !editorReadonly && config.no-indent-newline.[command_name].enable`;
const enable_desc = `Enables the command and keybind to insert a non-indented newline on the [is_postfix] line[is_destructive].`;
const invert_desc = `Invert the default ordering - With multiple selections on the same line, the left-most selection is placed at the [is_postfix].`;
const position_desc = `Selection position to compare and use as the focal point of calculations. Start, Active, Anchor, End.`;
const filter_desc = `Filter selections similar to how VSCode does before doing operations.`;

enum IsPostfixRelativeEnum {
    true = `next`,
    false = `previous`
}
enum IsPostfixAbsoluteEnum {
    true = `top`,
    false = `bottom`
}
enum IsDestructiveEnum {
    true = ` deleting the selection and moving text after it, with it`,
    false = ``
}
enum PositionDescriptionsEnum {
    active = `A selection's active cursor position`,
    anchor = `A selection's anchor position, opposite the active cursor`,
    start = `A selection's beginning position`,
    end = `A selection's ending position`
}
enum PositionLabelsEnum {
    active = `Selection active cursor`,
    anchor = `Selection anchor`,
    start = `Selection start`,
    end = `Selection end`
}

enum DefaultKeyEnum {
    after = `Ctrl + Shift + Meta + Enter`,
    before = `Ctrl + Shift + Alt + Meta + Enter`,
    down = `Ctrl + Meta + Enter`,
    up = `Ctrl + Alt + Meta + Enter`
}

/**
   * Meta: Generate package.json content
   * @internal
   */
function modify_package_json() {
    const package_json_path: string = path.join(__dirname + `/../../package.json`);
    let package_json_data: any = JSON.parse(fs.readFileSync(package_json_path, `utf8`));
    if ((package_json_data === null) || (package_json_data === undefined)) {
        return;
    }

    let keybindings: Object[] = [];
    let commands: Object[] = [];
    let configuration: Object[] = [];
    let conf_order_count = 0;

    for (const command in CommandNameEnum) {
        const command_id = CommandEnum[command as keyof typeof CommandEnum];
        const is_postfix: boolean = (command === CommandNameEnum.after || command === CommandNameEnum.down);
        const is_destructive: boolean = (command === CommandNameEnum.up || command === CommandNameEnum.down);

        const properties: { [index: string]: Object } = {};
        let prop_order_count = 0;
        for (const setting in SettingEnum) {
            if (!is_destructive && setting === SettingEnum.filter) {
                continue;
            }
            let desc = ``;
            let enum_: string[] = [];
            let markdownEnumDescriptions: string[] = [];
            let enumItemLabels: string[] = [];
            switch (setting) {
                case SettingEnum.enable:
                    desc = enable_desc.replace(IS_POSTFIX_REG, IsPostfixRelativeEnum[is_postfix as unknown as keyof typeof IsPostfixRelativeEnum]).replace(IS_DESTRUCTIVE_REG, IsDestructiveEnum[is_destructive as unknown as keyof typeof IsDestructiveEnum]);
                    break;
                case SettingEnum.invert:
                    desc = invert_desc.replace(IS_POSTFIX_REG, IsPostfixRelativeEnum[is_postfix as unknown as keyof typeof IsPostfixRelativeEnum]);
                    break;
                case SettingEnum.position:
                    desc = position_desc;
                    enum_ = Object.values(PositionEnum);
                    markdownEnumDescriptions = Object.values(PositionDescriptionsEnum);
                    enumItemLabels = Object.values(PositionLabelsEnum);
                    break;
                case SettingEnum.filter:
                    desc = filter_desc;
                    break;
                default:
                    break;
            }
            properties[`${command_id}.${setting}`] = {
                "order": prop_order_count,
                "type": typeof (CommandSettingsDefault[command_id][setting as SettingEnum]),
                "description": desc,
                "default": CommandSettingsDefault[command_id][setting as SettingEnum],
                ...(enum_.length > 0) && { "enum": enum_ },
                ...(markdownEnumDescriptions.length > 0) && { "markdownEnumDescriptions": markdownEnumDescriptions, },
                ...(enumItemLabels.length > 0) && { "enumItemLabels": enumItemLabels },
            };
            prop_order_count++;
        }

        const capitalized_command = command.charAt(0).toUpperCase() + command.slice(1);
        commands.push({
            "command": command_id,
            "title": `Insert Non-Indented Newline ${capitalized_command}`
        });

        configuration.push({
            "order": conf_order_count,
            "id": command,
            "title": capitalized_command,
            "properties": properties
        });

        const key: string = DefaultKeyEnum[command as keyof typeof DefaultKeyEnum].replaceAll(' ', '').toLowerCase();
        const key_win = key.replace(META_REG, "win");
        const key_mac = key.replace(CTRL_REG, "cmd");
        const when = when_condition.replace(COMMAND_NAME_REG, command);

        keybindings.push({
            "command": command_id,
            "key": key,
            "win": key_win,
            "linux": key,
            "mac": key_mac,
            "when": `${when} && config.${command_id}.enable`
        });
        conf_order_count++;
    }

    package_json_data.name = extension_name;
    package_json_data.displayName = extension_title;
    package_json_data.version = extension_version;
    package_json_data.publisher = author_name;
    package_json_data.bugs.url = `${extension_url}/issues/`;
    package_json_data.repository.type = `git`;
    package_json_data.repository.url = `${extension_url}.git`;
    package_json_data.homepage = `${extension_url}/`;
    package_json_data.contributes.configuration = configuration;
    package_json_data.contributes.commands = commands;
    package_json_data.contributes.keybindings = keybindings;

    if (!dry_run) {
        fs.writeFileSync(package_json_path, JSON.stringify(package_json_data, null, 4), {
            encoding: `utf8`,
            flag: `w`
        });
    }
}

/**
   * Meta: Generate readme.md content
   * @internal
   */
function modify_readme() {
    const readme_path: string = path.join(__dirname + `/../../README.md`);
    let readme_text: string = fs.readFileSync(readme_path, `utf8`);
    let features = ``;
    let settings = ``;
    for (const command in CommandNameEnum) {
        const command_id = CommandEnum[command as keyof typeof CommandEnum];
        const capitalized_command = command.charAt(0).toUpperCase() + command.slice(1);
        const key = DefaultKeyEnum[command as keyof typeof DefaultKeyEnum];
        const key_win = key.replace(META_REG, `Win`);
        const key_mac = key.replace(CTRL_REG, `Cmd`);
        const when = when_condition.replace(COMMAND_NAME_REG, command)

        features += `\n### Insert Non-Indented Newline ${capitalized_command}`
        features += `\n* Command Palette Name: \`Insert Non-Indented Newline ${capitalized_command}\``;
        features += `\n* Command Name: \`${command_id}\``;
        features += `\n* Linux default keybind: \`${key}\``;
        features += `\n* Windows default  keybind: \`${key_win}\``;
        features += `\n* Mac default keybind: \`${key_mac}\``;
        features += `\n* Default when condition: \`${when}\``;

        const is_postfix: boolean = (command === CommandNameEnum.after || command === CommandNameEnum.down);
        const is_destructive: boolean = (command === CommandNameEnum.up || command === CommandNameEnum.down);

        settings += `\n### ${capitalized_command}`;
        for (const setting in SettingEnum) {
            if (!is_destructive && (setting === SettingEnum.filter)) {
                continue;
            }
            let desc = `\n* \`${command_id}.${setting}\` : \`${CommandSettingsDefault[command_id][setting as keyof typeof SettingEnum]}\` : `;
            switch (setting) {
                case SettingEnum.enable:
                    desc += enable_desc.replace(IS_POSTFIX_REG, IsPostfixRelativeEnum[is_postfix as unknown as keyof typeof IsPostfixRelativeEnum]).replace(IS_DESTRUCTIVE_REG, IsDestructiveEnum[is_destructive as unknown as keyof typeof IsDestructiveEnum]);
                    break;
                case SettingEnum.invert:
                    desc += invert_desc.replace(IS_POSTFIX_REG, IsPostfixAbsoluteEnum[is_postfix as unknown as keyof typeof IsPostfixAbsoluteEnum]);
                    break;
                case SettingEnum.position:
                    desc += position_desc;
                    break;
                case SettingEnum.filter:
                    desc += filter_desc;
                    break;
                default:
                    break;
            }
            settings += desc;
        }

        settings += '\n';
        features += '\n';
    }

    const deleteable = /## Features(.*\n)*(?=## )## Settings(.*\n)*(?=# )/i;
    if (deleteable.test(readme_text)) {
        readme_text = readme_text.replace(deleteable, `## Features${features}\n## Settings${settings}\n`);
    } else {
        readme_text += `## Features${features}\n## Settings${settings}\n`;
    }
    if (!dry_run) {
        fs.writeFileSync(readme_path, readme_text, {
            encoding: `utf8`,
            flag: `w`
        });
    }
}

modify_package_json();
modify_readme();
