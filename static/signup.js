// Formulaires d'inscription : envoi vers Brevo sans quitter kumak.fr
document.querySelectorAll("form[data-signup]").forEach(function (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = form.querySelector('input[type="email"]');
    var box = form.querySelector(".thanks");
    var btn = form.querySelector("button");
    var action = form.getAttribute("data-action");
    box.hidden = false;

    if (!input.value || !input.checkValidity()) {
      box.textContent = "Saisissez une adresse e-mail valide, par exemple prenom@entreprise.fr.";
      input.focus();
      return;
    }
    if (form.querySelector(".hp").value) return; // robot

    if (!action) {
      box.textContent = "Les inscriptions ouvrent très bientôt. En attendant, écrivez à contact@kumak.fr pour être prévenu.";
      return;
    }

    btn.disabled = true;
    box.textContent = "Envoi en cours…";
    fetch(action, { method: "POST", body: new FormData(form), mode: "no-cors" })
      .then(function () { window.location.href = "/merci/"; })
      .catch(function () {
        btn.disabled = false;
        box.textContent = "L'inscription n'est pas passée. Réessayez ou écrivez à contact@kumak.fr.";
      });
  });
});
