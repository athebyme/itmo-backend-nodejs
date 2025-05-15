#!/bin/bash

# Проверяем, передан ли путь как аргумент
if [ $# -eq 0 ]; then
    BASE_PATH="."  # Если путь не указан, используем текущую директорию
else
    BASE_PATH="$1"  # Используем переданный путь
fi

# Имя выходного файла
OUTPUT_FILE="all_source_code.txt"

# Очищаем файл, если он существует
> $OUTPUT_FILE

# Добавляем заголовок с информацией
echo "=== Project Source Code Compilation ===" >> $OUTPUT_FILE
echo "=== Path: $BASE_PATH ===" >> $OUTPUT_FILE
echo "=== Date: $(date) ===" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Функция для проверки, является ли файл текстовым
is_text_file() {
    local file="$1"
    local extension="${file##*.}"

    # Список известных текстовых расширений
    local text_extensions=("go" "js" "jsx" "ts" "tsx" "css" "scss" "html" "htm" "xml" "json" "yaml" "yml" "md" "txt" "sh" "bash" "py" "rb" "php" "java" "c" "cpp" "h" "hpp" "ejs" "vue" "svelte" "sql" "graphql" "prisma" "env" "config" "toml" "ini")

    # Проверяем по расширению
    for ext in "${text_extensions[@]}"; do
        if [[ "$extension" == "$ext" ]]; then
            return 0  # Это текстовый файл
        fi
    done

    # Дополнительная проверка через MIME-тип
    if file --mime-type "$file" | grep -q "text/\|application/json\|application/javascript\|application/xml\|application/x-typescript"; then
        return 0  # Это текстовый файл по MIME-типу
    fi

    # Проверка на наличие бинарных символов
    if ! grep -q -P "[\x00-\x08\x0E-\x1F\x7F]" "$file" 2>/dev/null; then
        if head -c 100 "$file" | grep -q "[[:print:]]"; then
            return 0  # Вероятно текстовый файл (содержит печатаемые символы)
        fi
    fi

    return 1  # Не текстовый файл
}

# Функция для обработки файла
process_file() {
    local file="$1"
    # Проверяем, является ли файл текстовым
    if is_text_file "$file"; then
        echo "=== $file ===" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
        cat "$file" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    fi
}

# Исключаем директории, которые обычно содержат бинарные файлы или кэши
find "$BASE_PATH" -type f \
    -not -path "*/node_modules/*" \
    -not -path "*/vendor/*" \
    -not -path "*/dist/*" \
    -not -path "*/build/*" \
    -not -path "*/.git/*" \
    -not -path "*/bin/*" \
    | sort | while read -r file; do
    process_file "$file"
done

echo "Код из $BASE_PATH скомпилирован в файл $OUTPUT_FILE"