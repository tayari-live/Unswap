// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');

menuToggle.addEventListener('click', () => {
    nav.classList.toggle('active');
    const icon = menuToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
});

// Close menu when clicking nav links
document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
    });
});

// Populate countries
const countries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Guinea", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

const nationalitySelect = document.getElementById('nationality');
countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    nationalitySelect.appendChild(option);
});

// Form validation
const form = document.getElementById('signupForm');

function validateField(field) {
    const formGroup = field.closest('.form-group');
    let isValid = true;

    if (field.value.trim() === '') {
        isValid = false;
    } else if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailRegex.test(field.value);
    }

    if (isValid) {
        formGroup.classList.remove('has-error');
    } else {
        formGroup.classList.add('has-error');
    }

    return isValid;
}

form.querySelectorAll('input, select').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
});


// Submit event handler
form.addEventListener('submit', async (e) => {
e.preventDefault();

// Validate all fields
let isValid = true;
form.querySelectorAll('input, select').forEach(field => {
if (!validateField(field)) {
    isValid = false;
}
});

if (isValid) {
// Disable submit button to prevent double submission
const submitBtn = form.querySelector('.submit-btn');
const originalText = submitBtn.textContent;
submitBtn.textContent = 'Submitting...';
submitBtn.disabled = true;

// Prepare form data
const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    nationality: document.getElementById('nationality').value,
    city: document.getElementById('city').value,
    timestamp: new Date().toISOString()
};

try {
    // Replace with your actual Encharge webhook URL
    const webhookUrl = 'https://api.encharge.io/v1/hooks/48917605-b7a6-4329-abef-e3cb8b199267';
    
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    });

    if (response.ok) {
        // Success
        alert('Thank you for signing up! We will be in touch soon.');
        form.reset();
    } else {
        // Error from webhook
        throw new Error('Failed to submit form');
    }
} catch (error) {
    console.error('Error:', error);
    alert('There was an error submitting your form. Please try again.');
} finally {
    // Re-enable submit button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
}
}
});


// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
