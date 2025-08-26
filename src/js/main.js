import { Parser } from 'n3';

document.addEventListener('DOMContentLoaded', () => {
    const actionLabels = document.querySelectorAll('.action-label');
    const actionPanels = document.querySelectorAll('.action-panel');

    actionLabels.forEach(actionLabel => {
        actionLabel.addEventListener('click', () => {
            // Hide all panels first
            actionPanels.forEach(panel => {
                panel.style.display = 'none';
            });

            // Show the selected panel
            const activeActionPanel = document.getElementById(`action-panel-${actionLabel.id}`);
            if (activeActionPanel) {
                activeActionPanel.style.display = 'block';
            }

            // Expand the content area
            const expandableContent = document.getElementById('expandable-content');
            const bottomRow = document.getElementById('bottom-row');
            
            expandableContent.classList.add('expanded');
            bottomRow.classList.add('expanded');

            const expandToggle = document.getElementById('expand-toggle');
            expandToggle.textContent = 'Collapse';
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

document.getElementById("retrieve-profile-form").addEventListener("submit", async e => {
    e.preventDefault();
    
    const webIdInput = document.getElementById("webid-input");
    const webId = webIdInput.value;

    await fetch(webId)
    .then(async response => {
        if (!response.ok) {
            if(response.status < 500)
            {
                const errorResponse = await response.json();
                throw errorResponse;
            }
        } 
        return await response.text()
    })
    .then(responseText => {
        console.log(responseText);
        const quadValuesDiv = document.getElementById('quad-values');
        quadValuesDiv.innerHTML = ''; // Clear existing values
        
        var parser = new Parser();
        parser.parse(responseText,
            (err, quad, prefixes) => {
                if (quad) {
                    // Create new row for quad values
                    const subjectDiv = document.createElement('div');
                    const predicateDiv = document.createElement('div');
                    const objectDiv = document.createElement('div');
                    
                    subjectDiv.className = 'quad-value';
                    predicateDiv.className = 'quad-value';
                    objectDiv.className = 'quad-value';
                    
                    subjectDiv.textContent = quad.subject.value;
                    predicateDiv.textContent = quad.predicate.value;
                    objectDiv.textContent = quad.object.value;
                    
                    quadValuesDiv.appendChild(subjectDiv);
                    quadValuesDiv.appendChild(predicateDiv);
                    quadValuesDiv.appendChild(objectDiv);

                    // Existing OIDC issuer logic
                    if (quad.predicate.id == "http://www.w3.org/ns/solid/terms#oidcIssuer") {
                        localStorage.setItem("solid_oidc_issuer", quad.object.value);
                        objectDiv.classList.add('highlight');
                    }
                } else if (err) {
                    console.error(`item not parseable as an n3 quad`, err);
                }
            })
    })
    .catch(e => {
        console.error(e);

        document.getElementById("error_details").innerText = e.error+"\n\n"+e.error_description;
        document.getElementById("error").classList = "";
    });
});