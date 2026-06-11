// ChiffTown Newsletter Signup — Reusable
(function () {
  var form = document.getElementById('blogNewsletterForm');
  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var email = document.getElementById('blogNewsletterEmail').value.trim();
    var btn = document.getElementById('blogNewsletterBtn');
    var msg = document.getElementById('blogNewsletterMsg');
    if (!email) return;
    btn.disabled = true;
    btn.textContent = 'Subscribing…';
    msg.textContent = '';
    try {
      var res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
      var data = await res.json();
      if (res.ok) {
        msg.textContent = "✅ You're in! We'll write when it's worth reading.";
        msg.style.color = '#68d391';
        document.getElementById('blogNewsletterEmail').value = '';
        btn.textContent = 'Subscribed!';
      } else {
        msg.textContent = data.error || 'Something went wrong — try again.';
        msg.style.color = '#f87171';
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    } catch (_) {
      msg.textContent = 'Network error — please try again.';
      msg.style.color = '#f87171';
      btn.disabled = false;
      btn.textContent = 'Subscribe';
    }
  });
})();
