/** DaisyUI semantic colors shared by buttons, badges, and status indicators. */
export enum DaisyColor {
  Neutral = 'neutral',
  Primary = 'primary',
  Secondary = 'secondary',
  Accent = 'accent',
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

export enum Animate {
  Ping = 'ping',
  Bounce = 'bounce',
}

/** Built-in DaisyUI palettes enabled by the app. */
export enum ThemePalette {
  Light = 'light',
  Dark = 'dark',
  Pastel = 'pastel',
  Fantasy = 'fantasy',
  Dracula = 'dracula',
  Night = 'night',
  Dim = 'dim',
}

/** Common DaisyUI component sizes. */
export enum ComponentSize {
  ExtraSmall = 'xs',
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
  ExtraLarge = 'xl',
}

/** Shared start/center/end alignment values. */
export enum Alignment {
  Start = 'start',
  Center = 'center',
  End = 'end',
}

// Domain-specific export names point to the same enums to keep component APIs readable.
export {
  Alignment as CardActionsAlign,
  Alignment as DividerPlacement,
  Alignment as PopoverAlign,
  ComponentSize as ButtonSize,
  ComponentSize as CardSize,
  ComponentSize as FileTreeSize,
  ComponentSize as InputSize,
  ComponentSize as LoadingSize,
  ComponentSize as MenuSize,
  ComponentSize as TabsSize,
  DaisyColor as ButtonColor,
  DaisyColor as DividerColor,
  DaisyColor as LoadingColor,
  DaisyColor as StatusTone,
  PopoverLocation as DropdownLocation,
}

export enum LoadingVariant {
  Spinner = 'spinner',
  Dots = 'dots',
  Ring = 'ring',
  Ball = 'ball',
  Bars = 'bars',
  Infinity = 'infinity',
}

export enum TabsVariant {
  Box = 'box',
  Border = 'border',
  Lift = 'lift',
}

export enum TabsPlacement {
  Top = 'top',
  Bottom = 'bottom',
}

export enum MenuDirection {
  Vertical = 'vertical',
  Horizontal = 'horizontal',
}

export enum MenuVariant {
  Box = 'box',
  Bordered = 'bordered',
  Plain = 'plain',
}

/** Arrangement of the content separated by a DaisyUI divider. */
export enum DividerDirection {
  Vertical = 'vertical',
  Horizontal = 'horizontal',
}

export enum ButtonVariant {
  Flat = 'flat',
  Outlined = 'outlined',
  Dash = 'dash',
  Ghost = 'ghost',
  Soft = 'soft',
  Link = 'link',
}

export enum ButtonType {
  Button = 'button',
  Submit = 'submit',
  Reset = 'reset',
}

export enum CardFigurePosition {
  Top = 'top',
  Bottom = 'bottom',
}

export enum CardElement {
  Div = 'div',
  Section = 'section',
  Aside = 'aside',
}

export enum InputType {
  Text = 'text',
  Password = 'password',
  Email = 'email',
  Number = 'number',
  Search = 'search',
  Tel = 'tel',
  Url = 'url',
  Date = 'date',
  Month = 'month',
  Week = 'week',
  Time = 'time',
  DateTimeLocal = 'datetime-local',
}

export enum FileTreeNodeType {
  File = 'file',
  Folder = 'folder',
}

export enum PopoverLocation {
  Top = 'top',
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right',
  Start = 'start',
  End = 'end',
  Center = 'center',
  TopStart = 'top start',
  TopCenter = 'top center',
  TopEnd = 'top end',
  BottomStart = 'bottom start',
  BottomCenter = 'bottom center',
  BottomEnd = 'bottom end',
  LeftStart = 'left start',
  LeftCenter = 'left center',
  LeftEnd = 'left end',
  RightStart = 'right start',
  RightCenter = 'right center',
  RightEnd = 'right end',
}

export enum PopoverSide {
  Top = 'top',
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right',
  Center = 'center',
}

export enum FolderColor {
  Red = 'bg-red-500',
  Orange = 'bg-orange-500',
  Amber = 'bg-amber-500',
  Yellow = 'bg-yellow-500',
  Lime = 'bg-lime-500',
  Green = 'bg-green-500',
  Emerald = 'bg-emerald-500',
  Teal = 'bg-teal-500',
  Cyan = 'bg-cyan-500',
  Sky = 'bg-sky-500',
  Blue = 'bg-blue-500',
  Indigo = 'bg-indigo-500',
  Violet = 'bg-violet-500',
  Purple = 'bg-purple-500',
  Fuchsia = 'bg-fuchsia-500',
  Pink = 'bg-pink-500',
  Rose = 'bg-rose-500',
}

















