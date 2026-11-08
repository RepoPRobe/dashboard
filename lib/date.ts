export function formatActivityDate(value: string) {
    const date = new Date(value);
    const dateParts = new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
    }).formatToParts(date);
    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
        dateParts.find((part) => part.type === type)?.value ?? '';
    const time = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);

    return `${getPart('day')} ${getPart('month')}, ${getPart('year')} ${time}`;
}
