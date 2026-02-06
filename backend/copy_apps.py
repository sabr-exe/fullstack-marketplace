from pathlib import Path


IGNORE_DIRS = {
    "__pycache__",
    "migrations",
    "tests",
}

IGNORE_FILES = {
    ".DS_Store",
}


def dump_apps_to_txt(project_root: Path, output_file: Path):
    apps_dir = project_root / "apps"

    if not apps_dir.exists():
        raise RuntimeError(f"'apps' directory not found in {project_root}")

    with open(output_file, "w", encoding="utf-8") as out:
        out.write("DUMP OF apps/\n")
        out.write("=" * 80 + "\n\n")

        for path in sorted(apps_dir.rglob("*")):
            # пропускаем директории
            if path.is_dir():
                continue

            # пропускаем лишние папки
            if any(part in IGNORE_DIRS for part in path.parts):
                continue

            # пропускаем лишние файлы
            if path.name in IGNORE_FILES:
                continue

            # пишем заголовок файла
            relative_path = path.relative_to(project_root)
            out.write("\n" + "#" * 80 + "\n")
            out.write(f"# FILE: {relative_path}\n")
            out.write("#" * 80 + "\n\n")

            try:
                content = path.read_text(encoding="utf-8")
            except Exception as e:
                out.write(f"<<ERROR READING FILE: {e}>>\n")
                continue

            out.write(content)
            out.write("\n")

    print(f"Apps dumped to: {output_file}")


if __name__ == "__main__":
    PROJECT_ROOT = Path(__file__).resolve().parent
    OUTPUT_FILE = PROJECT_ROOT / "apps_dump.txt"

    dump_apps_to_txt(PROJECT_ROOT, OUTPUT_FILE)
