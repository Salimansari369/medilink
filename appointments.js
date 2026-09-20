'use strict';

const APPOINTMENTS_STORAGE_KEY = 'medilinks-appointments';

document.addEventListener('DOMContentLoaded', () => {
  initAppointmentForm();
  initAppointmentsPage();
});

function initAppointmentForm() {
  const form = document.getElementById('contactForm');

  if (!form) {
    return;
  }

  const patientNameInput = document.getElementById('patientName');
  const emailInput = document.getElementById('email');
  const healthQueryInput = document.getElementById('healthQuery');
  const successBanner = document.getElementById('formSuccess');

  const fieldConfig = [
    {
      input: patientNameInput,
      groupId: 'grpPatientName',
      errorId: 'patientNameError'
    },
    {
      input: emailInput,
      groupId: 'grpEmail',
      errorId: 'emailError'
    },
    {
      input: healthQueryInput,
      groupId: 'grpHealthQuery',
      errorId: 'healthQueryError'
    }
  ];

  fieldConfig.forEach(({ input, groupId, errorId }) => {
    input?.addEventListener('input', () => {
      clearError(groupId, errorId, input);
      hideSuccessBanner(successBanner);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const patientName = patientNameInput?.value.trim() ?? '';
    const email = emailInput?.value.trim() ?? '';
    const healthQuery = healthQueryInput?.value.trim() ?? '';

    let isValid = true;

    if (!patientName) {
      showError('grpPatientName', 'patientNameError', patientNameInput, 'Patient name is required.');
      isValid = false;
    } else if (patientName.length < 2) {
      showError('grpPatientName', 'patientNameError', patientNameInput, 'Patient name must contain at least 2 characters.');
      isValid = false;
    } else {
      clearError('grpPatientName', 'patientNameError', patientNameInput);
    }

    if (!email) {
      showError('grpEmail', 'emailError', emailInput, 'Email address is required.');
      isValid = false;
    } else if (!isValidEmail(email)) {
      showError('grpEmail', 'emailError', emailInput, 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearError('grpEmail', 'emailError', emailInput);
    }

    if (!healthQuery) {
      showError('grpHealthQuery', 'healthQueryError', healthQueryInput, 'Health query or message is required.');
      isValid = false;
    } else {
      clearError('grpHealthQuery', 'healthQueryError', healthQueryInput);
    }

    if (!isValid) {
      return;
    }

    const appointmentRecord = {
      id: createAppointmentId(),
      patientName,
      email,
      healthQuery,
      timestamp: new Date().toISOString()
    };

    try {
      const existingAppointments = getStoredAppointments();
      existingAppointments.unshift(appointmentRecord);
      saveAppointments(existingAppointments);
    } catch (error) {
      window.alert('Unable to save the appointment request in LocalStorage for this browser.');
      return;
    }

    form.reset();
    fieldConfig.forEach(({ input, groupId, errorId }) => clearError(groupId, errorId, input));

    if (successBanner) {
      successBanner.textContent = 'Appointment request submitted successfully. You can review it on the Appointments page.';
      successBanner.classList.add('show');
    }
  });
}

function initAppointmentsPage() {
  const appointmentsList = document.getElementById('appointmentsList');

  if (!appointmentsList) {
    return;
  }

  const countElement = document.getElementById('appointmentCount');
  const clearAllButton = document.getElementById('clearAppointmentsBtn');

  function renderAppointments() {
    const appointments = getStoredAppointments();
    appointmentsList.innerHTML = '';

    if (countElement) {
      const label = appointments.length === 1 ? '1 request saved' : `${appointments.length} requests saved`;
      countElement.textContent = label;
    }

    if (clearAllButton) {
      clearAllButton.disabled = appointments.length === 0;
    }

    if (!appointments.length) {
      const emptyState = document.createElement('div');
      emptyState.className = 'appointments-empty';
      emptyState.innerHTML = `
        <h3>No appointment requests available.</h3>
        <p>New requests submitted from the Contact page will appear here automatically.</p>
        <a class="btn-primary" href="contact.html">Book Appointment</a>
      `;
      appointmentsList.appendChild(emptyState);
      return;
    }

    appointments.forEach((appointment) => {
      const card = document.createElement('article');
      card.className = 'appointment-card';

      const header = document.createElement('div');
      header.className = 'appointment-card__header';

      const titleWrap = document.createElement('div');
      const title = document.createElement('h3');
      title.className = 'appointment-card__title';
      title.textContent = appointment.patientName;

      const timestamp = document.createElement('p');
      timestamp.className = 'appointment-card__timestamp';
      timestamp.textContent = formatTimestamp(appointment.timestamp);

      titleWrap.appendChild(title);
      titleWrap.appendChild(timestamp);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'appointment-delete';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => deleteAppointment(appointment.id));

      header.appendChild(titleWrap);
      header.appendChild(deleteButton);

      const details = document.createElement('div');
      details.className = 'appointment-card__details';

      details.appendChild(buildDetailRow('Email', appointment.email));
      details.appendChild(buildDetailRow('Health Query', appointment.healthQuery, true));

      card.appendChild(header);
      card.appendChild(details);
      appointmentsList.appendChild(card);
    });

    if (typeof initScrollReveal === 'function') {
      initScrollReveal();
    }
  }

  function deleteAppointment(appointmentId) {
    const shouldDelete = window.confirm('Delete this appointment request?');

    if (!shouldDelete) {
      return;
    }

    const nextAppointments = getStoredAppointments().filter((appointment) => appointment.id !== appointmentId);
    saveAppointments(nextAppointments);
    renderAppointments();
  }

  clearAllButton?.addEventListener('click', () => {
    const shouldClear = window.confirm('Clear all appointment requests?');

    if (!shouldClear) {
      return;
    }

    saveAppointments([]);
    renderAppointments();
  });

  renderAppointments();
}

function showError(groupId, errorId, input, message) {
  const group = document.getElementById(groupId);
  const error = document.getElementById(errorId);

  if (!group || !error || !input) {
    return;
  }

  group.classList.add('error');
  input.setAttribute('aria-invalid', 'true');
  error.textContent = message;
  error.style.display = 'block';
}

function clearError(groupId, errorId, input) {
  const group = document.getElementById(groupId);
  const error = document.getElementById(errorId);

  if (!group || !error || !input) {
    return;
  }

  group.classList.remove('error');
  input.removeAttribute('aria-invalid');
  error.textContent = '';
  error.style.display = 'none';
}

function hideSuccessBanner(successBanner) {
  successBanner?.classList.remove('show');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function createAppointmentId() {
  return `appointment-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getStoredAppointments() {
  try {
    const rawValue = window.localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
}

function saveAppointments(appointments) {
  window.localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function buildDetailRow(labelText, valueText, isHighlighted) {
  const row = document.createElement('div');
  row.className = isHighlighted ? 'appointment-detail appointment-detail--query' : 'appointment-detail';

  const label = document.createElement('span');
  label.className = 'appointment-detail__label';
  label.textContent = labelText;

  const value = document.createElement(isHighlighted ? 'p' : 'span');
  value.className = 'appointment-detail__value';
  value.textContent = valueText;

  row.appendChild(label);
  row.appendChild(value);

  return row;
}
