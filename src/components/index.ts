import { BoardRenderProps } from "./board";
import { DialogRenderProps } from "./dialog";
import { DigitsRenderProps } from "./digits";
import { NotificationRenderProps } from "./notification";
import { PromptDialogRenderProps } from "./prompt-dialog";

type RenderProps = 
    | DigitsRenderProps 
    | BoardRenderProps
    | DialogRenderProps
    | PromptDialogRenderProps 
    | NotificationRenderProps;

export type Component<T extends RenderProps = RenderProps> = (renderProps: T) => void;

export type ComponentMap = {
  renderDigits: Component<DigitsRenderProps>;
  renderBoard: Component<BoardRenderProps>;
  renderDialog: Component<DialogRenderProps>;
  renderPromptDialog: Component<PromptDialogRenderProps>;
  renderNotification: Component<NotificationRenderProps>;
};
