const openAddPersonModalBtn = document.getElementById('openAddPersonModalBtn');
const addPersonModalBtn = document.getElementById('addPersonModalBtn');
const modalNameInput = document.getElementById('modalNameInput');
const modalClassInput = document.getElementById('modalClassInput'); // This is a select input for classes
const modalLevelInput = document.getElementById('modalLevelInput');
const predefinedUserSelect = document.getElementById('predefinedUserSelect');
const toggleNewPerson = document.getElementById('toggleNewPerson');
const newPersonFields = document.getElementById('newPersonFields');
const predefinedUserFields = document.getElementById('predefinedUserFields');
const predefinedClassFilter = document.getElementById('predefinedClassFilter');

let targetGroupIndexForModal = -1; // -1 means add to the last group, otherwise specific group index
const peopleList = document.getElementById('peopleList');
const downloadXlsxBtn = document.getElementById('downloadXlsxBtn');

const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
const generateKVMGroupsBtn = document.getElementById('generateKVMGroupsBtn');
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
        nameSpan.classList.add('person-name'); // Add class for styling
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
    generateGroupsBtn.disabled = false;
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

        // Add header row
        const headerLi = document.createElement('li');
        headerLi.classList.add('list-group-item', 'list-group-item-dark', 'd-flex', 'justify-content-between', 'align-items-center');
        headerLi.innerHTML = '<span class="flex-grow-1">Nome</span><span class="flex-grow-1">Classe</span><span>Nível</span>';
        memberList.appendChild(headerLi);

        group.forEach((member, memberIndex) => {
            const li = document.createElement('li');
            li.draggable = true;
            li.dataset.groupIndex = groupIndex;
            li.dataset.memberIndex = memberIndex;
            li.addEventListener('dragstart', dragStart);

            const memberDetails = document.createElement('div');
            memberDetails.classList.add('member-details', 'd-flex', 'justify-content-between', 'align-items-center'); // Using Bootstrap flex classes

            // Name
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('person-name', 'flex-grow-1'); // flex-grow-1 to take available space
            nameSpan.textContent = member.name; // Removed "Nome: "
            memberDetails.appendChild(nameSpan);

            // Class
            const classSpan = document.createElement('span');
            classSpan.classList.add('flex-grow-1');
            classSpan.textContent = member.classe || 'N/A'; // Removed "Classe: "
            memberDetails.appendChild(classSpan);

            // Level
            const levelContainer = document.createElement('span');
            levelContainer.classList.add('level-container', 'd-flex', 'align-items-center'); // Flex for level and controls
            const levelText = document.createElement('span');
            levelText.textContent = member.level || 'N/A'; // Removed "Nível: "
            levelContainer.appendChild(levelText);

            const levelControlSpan = document.createElement('span');
            levelControlSpan.classList.add('level-controls', 'ms-2'); // ms-2 for margin-left

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

// Function to toggle visibility of new person fields vs. predefined user fields
function togglePersonFields() {
    if (toggleNewPerson.checked) {
        newPersonFields.style.display = 'block';
        predefinedUserFields.style.display = 'none';
        predefinedUserSelect.value = ''; // Clear selection when switching to new person
        // predefinedClassFilter.value = ''; // Removed
    } else {
        newPersonFields.style.display = 'none';
        predefinedUserFields.style.display = 'block';
        // Clear new person fields when switching to predefined
        modalNameInput.value = '';
        modalClassInput.value = '';
        modalLevelInput.value = '';
    }
}

toggleNewPerson.addEventListener('change', togglePersonFields);

openAddPersonModalBtn.addEventListener('click', () => {
    targetGroupIndexForModal = -1; // Reset to add to the last group
    // Default to adding a new person when opening from the main button
    toggleNewPerson.checked = true;
    togglePersonFields(); // Apply initial visibility

    modalNameInput.value = '';
    modalClassInput.value = '';
    modalLevelInput.value = '';
    predefinedUserSelect.value = ''; // Clear selection
    // predefinedClassFilter.value = ''; // Removed
    populatePredefinedUserSelect(predefinedClassFilter.value); // Populate dropdown with filter
    populateModalClassInput(); // Populate modal class dropdown
    populatePredefinedClassFilter(); // Populate predefined class filter
    const addPersonModal = new bootstrap.Modal(document.getElementById('addPersonModal'));
    addPersonModal.show();
});

addPersonModalBtn.addEventListener('click', () => {
    let person = null;

    if (toggleNewPerson.checked) {
        // Add new user
        const name = modalNameInput.value.trim();
        const classe = modalClassInput.value.trim(); // Get value from text input
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
        person = { name, classe, level: parsedLevel };
    } else {
        // Add predefined user
        const selectedPredefinedUser = predefinedUserSelect.value;
        if (!selectedPredefinedUser) {
            alert('Por favor, selecione um usuário pré-definido.');
            return;
        }
        person = JSON.parse(selectedPredefinedUser);
    }

    if (person) {
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
        predefinedUserSelect.value = '';
        // predefinedClassFilter.value = ''; // Removed
    }
});

// Function to open the modal for adding a person to a specific group
function addPersonToSpecificGroup(targetGroupIndex) {
    targetGroupIndexForModal = targetGroupIndex;
    // Default to selecting a predefined user when opening from a group's '+' button
    toggleNewPerson.checked = false;
    togglePersonFields(); // Apply initial visibility

    modalNameInput.value = '';
    modalClassInput.value = '';
    modalLevelInput.value = '';
    predefinedUserSelect.value = ''; // Clear selection
    // predefinedClassFilter.value = ''; // Removed
    populatePredefinedUserSelect(predefinedClassFilter.value); // Populate dropdown with filter
    populateModalClassInput(); // Populate modal class dropdown
    populatePredefinedClassFilter(); // Populate predefined class filter
    const addPersonModal = new bootstrap.Modal(document.getElementById('addPersonModal'));
    addPersonModal.show();
}

let draggedItem = null;

function dragStart(e) {
    draggedItem = e.target;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
        groupIndex: draggedItem.dataset.groupIndex,
        memberIndex: draggedItem.dataset.memberIndex
    }));
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
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const fromGroupIndex = parseInt(data.groupIndex);
        const fromMemberIndex = parseInt(data.memberIndex);

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

        // Prevent dropping on itself or if target group is full
        if (fromGroupIndex === toGroupIndex && fromMemberIndex === toMemberIndex) {
            return;
        }
        if (targetGroup.length >= 5 && fromGroupIndex !== toGroupIndex) { // Assuming max 5 members per group
            alert("Este grupo já está cheio!");
            return;
        }

        // Remove from source group
        const [movedMember] = sourceGroup.splice(fromMemberIndex, 1);

        // Add to target group
        if (toMemberIndex === -1 || toMemberIndex >= targetGroup.length) {
            targetGroup.push(movedMember);
        } else {
            targetGroup.splice(toMemberIndex, 0, movedMember);
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

generateKVMGroupsBtn.addEventListener('click', () => {
    generateKVMGroups();
});

function generateKVMGroups() {
    allGroups = []; // Clear existing groups

    const kvmRawGroups = [
        ["TATALUGA", "Ero", "Daizinha", "Fall", "VPDA"],
        ["Dicolino", "rika", "Tawaata", "NoSilence", "Fujika"],
        ["psytech", "Niyumi", "Kaotic", "Xuxuzera", "NoTarget"],
        ["Sylf", "Akdi", "Sfitzer", "Zxephyr", "Galbatorys"],
        ["Padre Quevedo", "RGKhinary", "OniKUri", "KaytGypsy", "kauemsilva"],
        ["Mabson", "Darwin Zach", "Weidman", "lHCl", "Raipan"],
        ["Hodeki", "Anarchy", "MorganaBr", "Freeza", "Azrk"],
        ["reivindic", "Melocks", "DeusDragon", "Murdox", "KyrosX"],
        ["xHinata", "NickxD", "invicte", "GibaPerez", "Halissa"],
        ["maik3", "BenitoBigode", "Belllk", "Lukastiel", "ipixuna"],
        ["Save you", "Alleff", "Morenga", "Higush", "Ehgirl"],
        ["Xacalzin", "magiclord", "Sameru", "Leas", "Baltazar"],
        ["Fl4meheal", "Cai0", "Yelrad", "Tynt", "Dokubok"]
    ];

    const defaultLevel = 60; // Already defined as 'level' in script.js
    const defaultClasse = "Desconhecida"; // Default class for unmatched users

    kvmRawGroups.forEach(rawGroup => {
        const newGroup = [];
        rawGroup.forEach(memberName => {
            // Find the member in predefinedUsers
            const foundUser = predefinedUsers.find(user => user.name === memberName);

            if (foundUser) {
                newGroup.push({
                    name: foundUser.name,
                    classe: foundUser.classe,
                    level: foundUser.level
                });
            } else {
                // If not found, use default values
                newGroup.push({
                    name: memberName,
                    classe: defaultClasse,
                    level: defaultLevel
                });
            }
        });
        allGroups.push(newGroup);
    });

    renderCurrentGroupList();
    renderGroups();
}


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

// Predefined Users Logic
const classes = [
    "Sacerdote", "Paladino", "Assassino", "Ferreiro", "Alquimista",
    "Sniper", "Sabio", "Bruxo", "Cavaleiro", "Stalker",
    "Clown", "Odalisca", "Champion"
];
classes.sort(); // Sort classes alphabetically immediately

const specificKnightNames = ["Daizinha", "Hodeki", "Fujika", "Yelrad", "magiclord", "GeForceSX", "Murdox", "Xuxuzera", "xHinata", "Spectro"];
const specificPaladinNames = ["Dokubok", "Sfitzer", "Raipan", "RGKhinary", "Alleff"];
const specificPriestNames = ["NoSilence", "Anarchy", "Sylf", "Padre Quevedo", "psytech", "Mabson", "Fl4meheal", "TATALUGA", "Save you", "Halissa", "maik3", "xSimba", "Sameru", "Melocks"];

const specificSageNames = ["Lohrwin", "rika"];
const specificAssassinNames = ["NoTarget", "Baltazar", "Darwin Zach", "Ero", "KyrosX", "EmOR", "Lukastiel", "Surfera"];
const specificWizardNames = ["Freeza", "Galbatorys", "Dicolino", "kauemsilva", "lHCl", "Ehgirl", "Fall", "Niyumi"];

const specificStalkerNames = ["Morenga"];
const specificSniperNames = ["OniKUri", "Cai0", "Xacalzin", "NickxD", "Tynt", "invicte", "VPDA", "reivindic", "Tawaata", "DeusDragon", "Mushira", "Azrk", "Zxephyr", "GibaPerez", "lDantecry"];

const specificClownNames = ["Akdi", "ipixuna"];
const specificBlacksmithNames = ["Kaotic", "Hideroshi"];
const specificAlchemistNames = ["Leas", "Higush", "BenitoBigode", "Weidman", "MorganaBr", "Belllk"];
const specificOdalisqueNames = ["KaytGypsy"];

const predefinedUsers = [];
const level = 60;

// Add specific Knight names first
specificKnightNames.forEach(name => {
    predefinedUsers.push({
        name: name,
        classe: "Cavaleiro",
        level: level
    });
});

// Add specific Paladin names
specificPaladinNames.forEach(name => {
    predefinedUsers.push({
        name: name,
        classe: "Paladino",
        level: level
    });
});

// Add specific Priest names
specificPriestNames.forEach(name => {
    predefinedUsers.push({
        name: name,
        classe: "Sacerdote",
        level: level
    });
});

// Add specific Assassin names
specificAssassinNames.forEach(name => {
    predefinedUsers.push({
        name: name,
        classe: "Assassino",
        level: level
    });
});

// Add specific Sage names
specificSageNames.forEach(name => {
    predefinedUsers.push({
        name: name,
        classe: "Sabio",
        level: level
    });
});

// Add specific Wizard names
specificWizardNames.forEach(name => {
    predefinedUsers.push({
        name: name,
        classe: "Bruxo",
        level: level
    });
});


specificStalkerNames.forEach(name => {
    predefinedUsers.push({
        name: name,
        classe: "Stalker",
        level: level
    });
});

// Add specific Sniper names
specificSniperNames.forEach(name => {
    predefinedUsers.push({
        name: name,
        classe: "Sniper",
        level: level
    });
});

// Add specific Clown names
specificClownNames.forEach(name => {
    predefinedUsers.push({
        name: name,
        classe: "Clown",
        level: level
    });
});

// Add specific Blacksmith names
specificBlacksmithNames.forEach(name => {
    predefinedUsers.push({
        name: name,
        classe: "Ferreiro",
        level: level
    });
});

// Add specific Alchemist names
specificAlchemistNames.forEach(name => {
    predefinedUsers.push({
        name: name,
        classe: "Alquimista",
        level: level
    });
});

// Add specific Odalisque names
specificOdalisqueNames.forEach(name => {
    predefinedUsers.push({
        name: name,
        classe: "Odalisca",
        level: level
    });
});

let currentPage = 1;
const itemsPerPage = 25;

function populatePredefinedUserSelect(classFilter = '') {
    predefinedUserSelect.innerHTML = '<option value="">-- Selecione --</option>';

    let filteredUsers = predefinedUsers;

    if (classFilter) {
        filteredUsers = predefinedUsers.filter(user => user.classe === classFilter);
    }

    // Sort filtered users by class, then by name
    filteredUsers.sort((a, b) => {
        if (a.classe < b.classe) return -1;
        if (a.classe > b.classe) return 1;
        return a.name.localeCompare(b.name);
    });

    filteredUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = JSON.stringify(user);
        option.textContent = `${user.name} (Classe: ${user.classe}, Nível: ${user.level})`;
        predefinedUserSelect.appendChild(option);
    });
}

function populateModalClassInput() {
    modalClassInput.innerHTML = '<option value="">-- Selecione a Classe --</option>';
    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = cls;
        modalClassInput.appendChild(option);
    });
}

function populatePredefinedClassFilter() {
    predefinedClassFilter.innerHTML = '<option value="">-- Todas as Classes --</option>';
    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = cls;
        predefinedClassFilter.appendChild(option);
    });
}

predefinedClassFilter.addEventListener('change', () => {
    const selectedClass = predefinedClassFilter.value;
    populatePredefinedUserSelect(selectedClass);
});

// Initial render on page load
renderCurrentGroupList();
renderGroups();
populatePredefinedUserSelect(); // Populate dropdown on load
populateModalClassInput(); // Populate modal class dropdown on load
populatePredefinedClassFilter(); // Populate predefined class filter on load
