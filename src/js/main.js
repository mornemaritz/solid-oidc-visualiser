// This file contains the main JavaScript logic for the application. 
// It handles the click events for the blocks and arrows, allowing them to be individually clickable.

// document.addEventListener('DOMContentLoaded', () => {
//     const blocks = document.querySelectorAll('.block');

//     blocks.forEach(block => {
//         block.addEventListener('click', () => {
//             alert(`Block clicked: ${block.textContent}`);
//         });
//     });
// });

document.addEventListener('DOMContentLoaded', function() {
    const expandableContent = document.getElementById('expandable-content');
    const expandToggle = document.getElementById('expand-toggle');
    
    expandToggle.addEventListener('click', function() {
        expandableContent.classList.toggle('expanded');
        expandToggle.textContent = expandableContent.classList.contains('expanded') ? 'Collapse' : 'Expand';
    });
});