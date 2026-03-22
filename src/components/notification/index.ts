export type NotificationRenderProps = {
    msg: string;
    timeoutMS?: number;
};

export const createNotificationComponent = () => {
    return ({msg, timeoutMS = 1000}: NotificationRenderProps) => {
        const template = document.querySelector('#notification') as HTMLTemplateElement;
        const clone = template.content.cloneNode(true) as HTMLElement;

        const message = clone.querySelector('.notification-message') as HTMLElement;
        message.innerText = msg;

        const notificationArea = document.querySelector('.notification-area') as HTMLElement;
        notificationArea.appendChild(clone);

        // The original reference is a DocumentFragment, need to find the notification element in the DOM tree to continue using it
        const notificationList = notificationArea.querySelectorAll(
            '.notification-area > .notification',
        ) as NodeListOf<HTMLElement>;
        const notification = notificationList[notificationList.length - 1];

        setTimeout(() => {
            notification.style.opacity = '0';

            setTimeout(() => {
                notification.remove();
            }, 1000);
        }, timeoutMS);
    }
};
