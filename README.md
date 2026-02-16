# WaveSpace

WaveSpace es un modelo experimental para representar sonido como una entidad espacial tridimensional en tiempo real.


Proyección geométrica del estado acústico.

---

## Modelo

El sonido se captura desde el micrófono y se reduce a tres variables fundamentales:

- Energía (RMS)
- Frecuencia dominante (FFT)
- Tiempo

Se proyecta en un sistema cartesiano donde:

- X → Tiempo
- Y → Energía
- Z → Frecuencia

Formalmente:

    P(t) = ( t , A(t) , F(t) )

Cada frame representa el estado instantáneo del sistema acústico.
La trayectoria acumulada es la evolución estructural del sonido.

---

## Decisiones

- RMS para estabilidad en amplitud.
- Pico espectral como aproximación directa de frecuencia dominante.
- Sin suavizado artificial.
- Sin interpolación visual.

La geometría refleja datos procesados, no animación decorativa.

---

## Alcance Actual

- Representación puntual en 3D.
- Rastro acumulativo como memoria temporal.
- Captura en tiempo real.

---

## Limitaciones Conscientes

- No hay detección real de pitch.
- No se modela fase.
- No se representa el espectro completo.
- No existe persistencia ni análisis histórico.

Esto es un modelo estructural mínimo, no un analizador acústico completo.

---

## Dirección

- Autocorrelación para pitch real.
- Superficie espectral (tiempo × frecuencia × energía).
- Extensión a N dimensiones.
- Integración con motores de procesamiento o IA.

---

## Propósito

Explorar el sonido como estado en un espacio matemático.

No interpretarlo.
Exponer su estructura.
