
document.addEventListener('DOMContentLoaded', () => {
    const actionLabels = document.querySelectorAll('.action-label');

    actionLabels.forEach(actionLabel => {
        actionLabel.addEventListener('click', () => {
            const actionPanelHeader = document.getElementById('action-panel-header');
            actionPanelHeader.textContent = `Action: ${actionLabel.textContent}`;

            const expandableContent = document.getElementById('expandable-content');
            const bottomRow = document.getElementById('bottom-row');

            expandableContent.classList.add('expanded');
            bottomRow.classList.add('expanded');

            const expandToggle = document.getElementById('expand-toggle');
            expandToggle.textContent = expandableContent.classList.contains('expanded') ? 'Collapse' : 'Expand';
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const expandableContent = document.getElementById('expandable-content');
    const expandToggle = document.getElementById('expand-toggle');
    const bottomRow = document.getElementById('bottom-row');
    
    expandToggle.addEventListener('click', function() {
        expandableContent.classList.toggle('expanded');
        bottomRow.classList.toggle('expanded');
        expandToggle.textContent = expandableContent.classList.contains('expanded') ? 'Collapse' : 'Expand';
    });
});