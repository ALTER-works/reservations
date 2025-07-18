
(() => {
  const container = document.getElementById('flash-container');

  if (!container) return;

  // Получаем все флэш-сообщения
  const flashes = container.querySelectorAll('.flash');

  flashes.forEach((flash, idx) => {
    // Для каждого элемента делаем анимацию "выезда"
    // Используем setTimeout, чтобы сдвинуть появление последующих с задержкой
    setTimeout(() => {
      flash.classList.add('show');
    }, idx * 200); // каждый следующий появляется спустя 200мс от предыдущего

    // Через 4 секунды начинает скрываться
    setTimeout(() => {
      flash.classList.remove('show');
      flash.classList.add('hide');
    }, 4000 + idx * 200);

    // После анимации скрытия полностью удаляем элемент из DOM
    flash.addEventListener('transitionend', (event) => {
      if (!flash.classList.contains('show')) {
        flash.remove();
      }
    });
  });
})();
