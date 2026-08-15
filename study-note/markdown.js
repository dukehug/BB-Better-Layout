// Study Note - dependency-free Markdown rendering and plain-text summaries.
// Rendering uses DOM nodes rather than innerHTML, so note content cannot inject scripts.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};

    function isSafeUrl(value) {
        try {
            const url = new URL(String(value || ''), window.location.href);
            return ['http:', 'https:', 'mailto:'].includes(url.protocol);
        } catch (error) {
            return false;
        }
    }

    function appendInline(container, source, depth = 0) {
        const text = String(source || '');
        if (!text || depth > 4) {
            container.appendChild(document.createTextNode(text));
            return;
        }

        const tokenPattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\[[^\]\n]+\]\([^\s)]+\)|\*[^*\n]+\*)/g;
        let cursor = 0;
        let match;

        while ((match = tokenPattern.exec(text)) !== null) {
            if (match.index > cursor) {
                container.appendChild(document.createTextNode(text.slice(cursor, match.index)));
            }

            const token = match[0];
            const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            let element = null;
            let content = '';

            if (token.startsWith('`')) {
                element = document.createElement('code');
                element.textContent = token.slice(1, -1);
            } else if (linkMatch && isSafeUrl(linkMatch[2])) {
                element = document.createElement('a');
                element.href = linkMatch[2];
                element.target = '_blank';
                element.rel = 'noopener noreferrer';
                appendInline(element, linkMatch[1], depth + 1);
            } else if (token.startsWith('**') || token.startsWith('__')) {
                element = document.createElement('strong');
                content = token.slice(2, -2);
            } else if (token.startsWith('~~')) {
                element = document.createElement('del');
                content = token.slice(2, -2);
            } else if (token.startsWith('*')) {
                element = document.createElement('em');
                content = token.slice(1, -1);
            }

            if (!element) {
                container.appendChild(document.createTextNode(token));
            } else {
                if (content) appendInline(element, content, depth + 1);
                container.appendChild(element);
            }
            cursor = match.index + token.length;
        }

        if (cursor < text.length) {
            container.appendChild(document.createTextNode(text.slice(cursor)));
        }
    }

    function isHorizontalRule(line) {
        return /^\s{0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})\s*$/.test(line);
    }

    function isListLine(line) {
        return /^\s{0,3}([-+*]|\d+[.)])\s+/.test(line);
    }

    function isBlockStart(lines, index) {
        const line = lines[index] || '';
        if (!line.trim()) return true;
        if (/^\s*```/.test(line)) return true;
        if (/^\s{0,3}#{1,6}\s+/.test(line)) return true;
        if (/^\s{0,3}>\s?/.test(line)) return true;
        if (isListLine(line) || isHorizontalRule(line)) return true;
        return isTableStart(lines, index);
    }

    function splitTableRow(line) {
        return String(line || '')
            .trim()
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map(cell => cell.trim());
    }

    function isTableStart(lines, index) {
        if (index + 1 >= lines.length || !lines[index].includes('|')) return false;
        const separators = splitTableRow(lines[index + 1]);
        return separators.length > 0
            && separators.every(cell => /^:?-{3,}:?$/.test(cell));
    }

    function renderTable(lines, startIndex, fragment) {
        const headers = splitTableRow(lines[startIndex]);
        const alignments = splitTableRow(lines[startIndex + 1]).map(cell => {
            if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
            if (cell.endsWith(':')) return 'right';
            return 'left';
        });
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headingRow = document.createElement('tr');

        headers.forEach((header, index) => {
            const cell = document.createElement('th');
            cell.style.textAlign = alignments[index] || 'left';
            appendInline(cell, header);
            headingRow.appendChild(cell);
        });
        thead.appendChild(headingRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        let index = startIndex + 2;
        while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
            const row = document.createElement('tr');
            const cells = splitTableRow(lines[index]);
            headers.forEach((unused, cellIndex) => {
                const cell = document.createElement('td');
                cell.style.textAlign = alignments[cellIndex] || 'left';
                appendInline(cell, cells[cellIndex] || '');
                row.appendChild(cell);
            });
            tbody.appendChild(row);
            index += 1;
        }
        table.appendChild(tbody);
        fragment.appendChild(table);
        return index;
    }

    function renderList(lines, startIndex, fragment) {
        const ordered = /^\s{0,3}\d+[.)]\s+/.test(lines[startIndex]);
        const list = document.createElement(ordered ? 'ol' : 'ul');
        let index = startIndex;

        while (index < lines.length) {
            const match = lines[index].match(/^\s{0,3}([-+*]|\d+[.)])\s+(.*)$/);
            const itemIsOrdered = match && /^\d/.test(match[1]);
            if (!match || itemIsOrdered !== ordered) break;

            const item = document.createElement('li');
            const checkboxMatch = match[2].match(/^\[([ xX])\](?:\s+(.*))?$/);
            if (checkboxMatch) {
                const isChecked = checkboxMatch[1].toLowerCase() === 'x';
                const checkbox = document.createElement('span');
                checkbox.className = 'bb-study-note-markdown-checkbox';
                checkbox.setAttribute('role', 'checkbox');
                checkbox.setAttribute('aria-checked', String(isChecked));
                checkbox.setAttribute('aria-disabled', 'true');
                checkbox.setAttribute('aria-label', isChecked ? 'Completed task' : 'Incomplete task');
                item.className = 'bb-study-note-markdown-task';
                item.appendChild(checkbox);
                const label = document.createElement('span');
                appendInline(label, checkboxMatch[2] || '');
                item.appendChild(label);
            } else {
                appendInline(item, match[2]);
            }
            list.appendChild(item);
            index += 1;
        }

        fragment.appendChild(list);
        return index;
    }

    function render(container, markdown) {
        const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
        const fragment = document.createDocumentFragment();
        let index = 0;

        while (index < lines.length) {
            const line = lines[index];
            if (!line.trim()) {
                index += 1;
                continue;
            }

            const fenceMatch = line.match(/^\s*```([\w-]*)\s*$/);
            if (fenceMatch) {
                const codeLines = [];
                index += 1;
                while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
                    codeLines.push(lines[index]);
                    index += 1;
                }
                if (index < lines.length) index += 1;
                const pre = document.createElement('pre');
                const code = document.createElement('code');
                if (fenceMatch[1]) code.className = `language-${fenceMatch[1]}`;
                code.textContent = codeLines.join('\n');
                pre.appendChild(code);
                fragment.appendChild(pre);
                continue;
            }

            const headingMatch = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
            if (headingMatch) {
                const heading = document.createElement(`h${headingMatch[1].length}`);
                appendInline(heading, headingMatch[2]);
                fragment.appendChild(heading);
                index += 1;
                continue;
            }

            if (isHorizontalRule(line)) {
                fragment.appendChild(document.createElement('hr'));
                index += 1;
                continue;
            }

            if (isTableStart(lines, index)) {
                index = renderTable(lines, index, fragment);
                continue;
            }

            if (/^\s{0,3}>\s?/.test(line)) {
                const quoteLines = [];
                while (index < lines.length && /^\s{0,3}>\s?/.test(lines[index])) {
                    quoteLines.push(lines[index].replace(/^\s{0,3}>\s?/, ''));
                    index += 1;
                }
                const quote = document.createElement('blockquote');
                appendInline(quote, quoteLines.join(' '));
                fragment.appendChild(quote);
                continue;
            }

            if (isListLine(line)) {
                index = renderList(lines, index, fragment);
                continue;
            }

            const paragraphLines = [];
            while (index < lines.length && !isBlockStart(lines, index)) {
                paragraphLines.push(lines[index].trim());
                index += 1;
            }
            const paragraph = document.createElement('p');
            appendInline(paragraph, paragraphLines.join(' '));
            fragment.appendChild(paragraph);
        }

        container.replaceChildren(fragment);
        if (!String(markdown || '').trim()) {
            const empty = document.createElement('p');
            empty.className = 'bb-study-note-markdown-empty';
            empty.textContent = 'Nothing to preview yet.';
            container.appendChild(empty);
        }
    }

    function toPlainText(markdown) {
        return String(markdown || '')
            .replace(/```[\s\S]*?```/g, match => match.replace(/^```[^\n]*|```$/g, ''))
            .replace(/^\s*\|?\s*:?-{3,}:?(?:\s*\|\s*:?-{3,}:?)+\s*\|?\s*$/gm, '')
            .replace(/^\s{0,3}(#{1,6}|>|[-+*]|\d+[.)])\s+/gm, '')
            .replace(/^\s*\[([ xX])\](?:\s+|$)/gm, '')
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/~~([^~]+)~~/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\*([^*\n]+)\*/g, '$1')
            .replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,!?:;])/g, '$1$2')
            .replace(/\|/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    BBLayout.studyNoteMarkdown = {
        isSafeUrl,
        render,
        toPlainText
    };
})();
