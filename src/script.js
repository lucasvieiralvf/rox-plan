const openAddPersonModalBtn = document.getElementById('openAddPersonModalBtn');
const addPersonModalBtn = document.getElementById('addPersonModalBtn');
const modalNameInput = document.getElementById('modalNameInput');
const modalClassInput = document.getElementById('modalClassInput');
const modalLevelInput = document.getElementById('modalLevelInput');

let targetGroupIndexForModal = -1; // -1 means add to the last group, otherwise specific group index
const peopleList = document.getElementById('peopleList');
const downloadXlsxBtn = document.getElementById('downloadXlsxBtn');




const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
const generateGroupsBtn = document.getElementById('generateGroupsBtn');
const groupsContainer = document.getElementById('groupsContainer');
const currentGroupTitle = document.getElementById('currentGroupTitle');

let allGroups = []; // Holds all groups, including the one currently being formed











downloadTemplateBtn.addEventListener('click', () => {
    const numGroups = 16;
    const membersPerGroup = 5;
    const worksheetData = [];

    // Create header row
    let header = [];
    for (let i = 0; i < numGroups; i++) {
        header.push(`Grupo ${i + 1}`);
        header.push('Classe');
        header.push('Nível');
        if (i < numGroups - 1) {
            header.push(''); // Separator column
        }
    }
    worksheetData.push(header);

    // Create data rows
    for (let memberIndex = 0; memberIndex < membersPerGroup; memberIndex++) {
        let row = [];
        for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
            row.push(`Pessoa ${groupIndex * membersPerGroup + memberIndex + 1}`);
            row.push(`Classe${groupIndex + 1}`);
            row.push(`Nivel${memberIndex + 1}`);
            if (groupIndex < numGroups - 1) {
                row.push(''); // Separator column
            }
        }
        worksheetData.push(row);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template.xlsx');
});

function renderCurrentGroupList() {
    peopleList.innerHTML = '';
    const lastGroup = allGroups.length > 0 ? allGroups[allGroups.length - 1] : [];
    currentGroupTitle.textContent = `Pessoas Adicionadas: (${lastGroup.length} de 5)`;

    lastGroup.forEach((person, index) => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${person.name} (Classe: ${person.classe || 'N/A'}, Nível: ${person.level || 'N/A'})`;
        li.appendChild(nameSpan);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'x';
        removeBtn.classList.add('remove-member-btn');
        removeBtn.addEventListener('click', () => {
            lastGroup.splice(index, 1);
            if (lastGroup.length === 0 && allGroups.length > 1) {
                allGroups.pop(); // Remove the empty group if it's not the only one
            }
            renderCurrentGroupList();
            renderGroups();
            updateGenerateGroupsButtonState();
        });
        li.appendChild(removeBtn);
        peopleList.appendChild(li);
    });
    updateGenerateGroupsButtonState();
    
}

function updateGenerateGroupsButtonState() {
    if (allGroups.some(group => group.length > 0)) { // Check if any group has members
        generateGroupsBtn.disabled = false;
    } else {
        generateGroupsBtn.disabled = true;
    }
}

function getAllGroups() {
    return allGroups; // allGroups is now the single source of truth
}

function renderGroups() {
    groupsContainer.innerHTML = '';
    const groupsToDisplay = getAllGroups();

    if (groupsToDisplay.length === 0) {
        return;
    }

    groupsToDisplay.forEach((group, groupIndex) => {
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('group-card');
        groupDiv.dataset.groupIndex = groupIndex; // Store group index for drag/drop

        const title = document.createElement('h3');
        title.textContent = `Grupo ${groupIndex + 1}`;
        groupDiv.appendChild(title);

        const memberList = document.createElement('ul');
        memberList.classList.add('member-list'); // Add class for styling and targeting
        memberList.addEventListener('dragover', dragOver);
        memberList.addEventListener('drop', drop);
        memberList.addEventListener('dragleave', dragLeave);

        group.forEach((member, memberIndex) => {
            const li = document.createElement('li');
            li.draggable = true;
            li.dataset.groupIndex = groupIndex;
            li.dataset.memberIndex = memberIndex;
            li.addEventListener('dragstart', dragStart);

            const memberDetails = document.createElement('div');
            memberDetails.classList.add('member-details');

            const nameSpan = document.createElement('span');
            nameSpan.textContent = `Nome: ${member.name}`;
            memberDetails.appendChild(nameSpan);

            const classSpan = document.createElement('span');
            classSpan.textContent = `Classe: ${member.classe || 'N/A'}`;
            memberDetails.appendChild(classSpan);

            const levelContainer = document.createElement('span');
            levelContainer.classList.add('level-container');
            const levelText = document.createElement('span');
            levelText.textContent = `Nível: ${member.level || 'N/A'}`;
            levelContainer.appendChild(levelText);

            const levelControlSpan = document.createElement('span');
            levelControlSpan.classList.add('level-controls');

            const decrementBtn = document.createElement('button');
            decrementBtn.textContent = '-';
            decrementBtn.classList.add('level-btn', 'level-decrement-btn');
            decrementBtn.addEventListener('click', () => {
                if (allGroups[groupIndex][memberIndex].level > 1) { // Prevent level from going below 1
                    allGroups[groupIndex][memberIndex].level--;
                    renderGroups();
                }
            });
            if (member.level > 1) {
                levelControlSpan.appendChild(decrementBtn);
            }

            const incrementBtn = document.createElement('button');
            incrementBtn.textContent = '+';
            incrementBtn.classList.add('level-btn', 'level-increment-btn');
            incrementBtn.addEventListener('click', () => {
                if (allGroups[groupIndex][memberIndex].level < 200) { // Prevent level from going above 200
                    allGroups[groupIndex][memberIndex].level++;
                    renderGroups();
                }
            });
            if (member.level < 200) {
                levelControlSpan.appendChild(incrementBtn);
            }

            levelContainer.appendChild(levelControlSpan);
            memberDetails.appendChild(levelContainer);

            li.appendChild(memberDetails);

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'x';
            removeBtn.classList.add('remove-member-btn');
            removeBtn.addEventListener('click', () => {
                allGroups[groupIndex].splice(memberIndex, 1);
                if (allGroups[groupIndex].length === 0 && allGroups.length > 1) {
                    allGroups.splice(groupIndex, 1); // Remove empty group if not the only one
                }
                renderCurrentGroupList();
                renderGroups();
            });
            li.appendChild(removeBtn);
            memberList.appendChild(li);
        });
        groupDiv.appendChild(memberList);

        if (group.length < 5) {
            const addMemberToGroupBtn = document.createElement('button');
            addMemberToGroupBtn.textContent = '+';
            addMemberToGroupBtn.classList.add('add-member-to-group-btn');
            addMemberToGroupBtn.addEventListener('click', () => {
                addPersonToSpecificGroup(groupIndex);
            });
            groupDiv.appendChild(addMemberToGroupBtn);
        }

        groupsContainer.appendChild(groupDiv);
    });
}

openAddPersonModalBtn.addEventListener('click', () => {
    targetGroupIndexForModal = -1; // Reset to add to the last group
    modalNameInput.value = '';
    modalClassInput.value = '';
    modalLevelInput.value = '';
    const addPersonModal = new bootstrap.Modal(document.getElementById('addPersonModal'));
    addPersonModal.show();
});

addPersonModalBtn.addEventListener('click', () => {
    const name = modalNameInput.value.trim();
    const classe = modalClassInput.value.trim();
    const level = modalLevelInput.value.trim();

    if (!name || !classe || !level) {
        alert('Por favor, preencha todos os campos (Nome, Classe, Nível).');
        return;
    }

    const parsedLevel = parseInt(level);
    if (isNaN(parsedLevel) || parsedLevel < 1) {
        alert('O Nível deve ser um número inteiro positivo.');
        return;
    }

    if (parsedLevel > 200) {
        alert('O Nível não pode ser maior que 200.');
        return;
    }

    const person = { name, classe, level: parsedLevel };

    if (targetGroupIndexForModal === -1) {
        // Add to the last group or create a new one
        let targetGroup;
        if (allGroups.length === 0 || allGroups[allGroups.length - 1].length === 5) {
            targetGroup = [];
            allGroups.push(targetGroup);
        } else {
            targetGroup = allGroups[allGroups.length - 1];
        }
        targetGroup.push(person);
    } else {
        // Add to a specific group
        allGroups[targetGroupIndexForModal].push(person);
    }

    renderCurrentGroupList();
    renderGroups();

    const addPersonModal = bootstrap.Modal.getInstance(document.getElementById('addPersonModal'));
    addPersonModal.hide();

    // Clear modal inputs after successful addition
    modalNameInput.value = '';
    modalClassInput.value = '';
    modalLevelInput.value = '';
});

// Function to open the modal for adding a person to a specific group
function addPersonToSpecificGroup(targetGroupIndex) {
    targetGroupIndexForModal = targetGroupIndex;
    modalNameInput.value = '';
    modalClassInput.value = '';
    modalLevelInput.value = '';
    const addPersonModal = new bootstrap.Modal(document.getElementById('addPersonModal'));
    addPersonModal.show();
}





let draggedItem = null;

function dragStart(e) {
    draggedItem = e.target;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', null); // Required for Firefox
    setTimeout(() => {
        draggedItem.classList.add('dragging');
    }, 0);
}

function dragOver(e) {
    e.preventDefault(); // Allow drop
    if (e.target.classList.contains('member-list') || e.target.tagName === 'LI') {
        e.dataTransfer.dropEffect = 'move';
        e.target.classList.add('drag-over');
    }
}

function dragLeave(e) {
    e.target.classList.remove('drag-over');
}

function drop(e) {
    e.preventDefault();
    e.target.classList.remove('drag-over');

    if (draggedItem) {
        const fromGroupIndex = parseInt(draggedItem.dataset.groupIndex);
        const fromMemberIndex = parseInt(draggedItem.dataset.memberIndex);

        let toGroupIndex;
        let toMemberIndex = -1; // Default to end of list

        if (e.target.tagName === 'LI') {
            toGroupIndex = parseInt(e.target.dataset.groupIndex);
            toMemberIndex = parseInt(e.target.dataset.memberIndex);
        } else if (e.target.classList.contains('member-list')) {
            toGroupIndex = parseInt(e.target.closest('.group-card').dataset.groupIndex);
            toMemberIndex = e.target.children.length; // Drop at the end of the list
        } else {
            return; // Not a valid drop target
        }

        // Get the actual group arrays
        const sourceGroup = allGroups[fromGroupIndex];
        const targetGroup = allGroups[toGroupIndex];

        // Remove from source group
        const [movedMember] = sourceGroup.splice(fromMemberIndex, 1);

        // Add to target group
        if (toMemberIndex === -1 || toMemberIndex >= targetGroup.length) {
            targetGroup.push(movedMember);
        } else {
            targetGroup.splice(toMemberIndex, 0, movedMember);
        }

        // If source group becomes empty and it's not the only group, remove it
        if (sourceGroup.length === 0 && allGroups.length > 1) {
            allGroups.splice(fromGroupIndex, 1);
        }

        renderCurrentGroupList(); // Re-render the current group display
        renderGroups(); // Re-render all groups to reflect changes
    }
    draggedItem.classList.remove('dragging');
    draggedItem = null;
}

generateGroupsBtn.addEventListener('click', () => {
    allGroups.push([]); // Always push a new empty group
    renderCurrentGroupList(); // Re-render the current group display
    renderGroups(); // Re-render all groups to reflect changes
});



downloadXlsxBtn.addEventListener('click', () => {
    const groupsToDownload = getAllGroups();
    if (groupsToDownload.length === 0) {
        alert('Gere os grupos primeiro antes de baixar.');
        return;
    }

    const worksheetData = [];
    const maxMembers = Math.max(...groupsToDownload.map(g => g.length));

    // Create header row
    let header = [];
    groupsToDownload.forEach((_, i) => {
        header.push(`Grupo ${i + 1}`);
        header.push('Classe');
        header.push('Nível');
        if (i < groupsToDownload.length - 1) {
            header.push(''); // Separator
        }
    });
    worksheetData.push(header);

    // Create data rows
    for (let i = 0; i < maxMembers; i++) {
        let row = [];
        groupsToDownload.forEach((group, groupIndex) => {
            const person = group[i];
            if (person) {
                row.push(person.name || '');
                row.push(person.classe || '');
                row.push(person.level || '');
            } else {
                row.push('', '', '');
            }
            if (groupIndex < groupsToDownload.length - 1) {
                row.push(''); // Separator
            }
        });
        worksheetData.push(row);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Grupos');
    XLSX.writeFile(wb, 'grupos.xlsx');
});

function downloadFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Initial render on page load
renderCurrentGroupList();
renderGroups();