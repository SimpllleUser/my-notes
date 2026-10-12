import type { EditorActions } from './useEditorActions'

export type SlashCommand = {
  name: string
  description: string
  icon: string
  keywords: string
  run: () => void
}

export function createSlashCommands(
  actions: EditorActions,
  openImagePopover: () => void,
): SlashCommand[] {
  return [
    {
      name: 'Звичайний текст',
      description: 'Простий текстовий блок',
      icon: 'T',
      keywords: 'text paragraph plain',
      run: actions.setText,
    },
    {
      name: 'Заголовок 1',
      description: 'Великий заголовок',
      icon: 'H1',
      keywords: 'heading title h1',
      run: () => actions.setHeading(1),
    },
    {
      name: 'Заголовок 2',
      description: 'Середній заголовок',
      icon: 'H2',
      keywords: 'heading title h2',
      run: () => actions.setHeading(2),
    },
    {
      name: 'Заголовок 3',
      description: 'Малий заголовок',
      icon: 'H3',
      keywords: 'heading title h3',
      run: () => actions.setHeading(3),
    },
    {
      name: 'Список задач',
      description: 'Задачі з чекбоксами',
      icon: '☑',
      keywords: 'task list todo checkbox',
      run: actions.toggleTaskList,
    },
    {
      name: 'Маркований список',
      description: 'Простий список',
      icon: '•',
      keywords: 'bullet list',
      run: actions.toggleBulletList,
    },
    {
      name: 'Нумерований список',
      description: 'Список із номерами',
      icon: '1.',
      keywords: 'numbered ordered list',
      run: actions.toggleOrderedList,
    },
    {
      name: 'Цитата',
      description: 'Виділена цитата',
      icon: '❝',
      keywords: 'quote blockquote',
      run: actions.toggleBlockquote,
    },
    {
      name: 'Toggle',
      description: 'Згортаний блок',
      icon: '▸',
      keywords: 'toggle collapse details',
      run: actions.insertToggle,
    },
    {
      name: 'Callout',
      description: 'Важна думка або підказка',
      icon: '💡',
      keywords: 'callout note tip',
      run: actions.insertCallout,
    },
    {
      name: 'Код',
      description: 'Блок коду',
      icon: '</>',
      keywords: 'code block',
      run: actions.toggleCodeBlock,
    },
    {
      name: 'Роздільник',
      description: 'Горизонтальна лінія',
      icon: '—',
      keywords: 'divider separator horizontal rule hr',
      run: actions.insertDivider,
    },
    {
      name: 'Таблиця',
      description: 'Таблиця 3×3 з заголовком',
      icon: '▦',
      keywords: 'table',
      run: actions.insertTable,
    },
    {
      name: 'Зображення',
      description: 'Вставити зображення за URL',
      icon: '▧',
      keywords: 'image picture photo',
      run: openImagePopover,
    },
  ]
}
