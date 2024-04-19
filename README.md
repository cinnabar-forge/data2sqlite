# data2sqlite

_By Cinnabar Forge_

**DISCLAIMER**: Until version 1.0.0, all versions below should be considered unstable and are subject to change.

A tool to insert data into SQLite databases from XML and other file types.

## Getting Started

### Installation

Install data2sqlite globally using npm:

```bash
npm install -g data2sqlite
```

This will make the `data2sqlite` command available in your terminal.

### Usage

```bash
data2sqlite --database "path" --table "my_table" --columns "columnA,columnB=kolonkaB,columnC" --keyValues "columnA='this value over every section'" --mode "xml" --source "path" --xmlNode "object"
```

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or create a pull request.

Clone the repository and install dependencies:

```bash
git clone git@github.com:cinnabar-forge/data2sqlite.git
cd data2sqlite
npm install
```

## License

data2sqlite is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Authors

- Timur Moziev ([@TimurRin](https://github.com/TimurRin))
