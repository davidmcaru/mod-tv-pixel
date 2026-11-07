package es.davidm.modtvpixel;

/** Salvapantallas — el salvapantallas: la misma pantalla, sin nada elegido, en un carrusel por las horas de la semana. */

import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.Process;
import android.service.dreams.DreamService;
import android.util.Log;
import android.view.ViewGroup;
import android.webkit.WebView;

public class Salvapantallas extends DreamService {
    private static final int MEMORIA_MAX = 400;
    private static final int VIGILA_CADA = 20000;

    private WebView web;
    private final Handler h = new Handler(Looper.getMainLooper());
    private final Runnable vigilar = new Runnable() {
        @Override
        public void run() {
            new Thread(() -> {
                int mb = Lectura.memoriaMB(), perdidas = Lectura.perdidasGrafica();
                h.post(() -> {
                    if (web == null) return;
                    if (mb > MEMORIA_MAX || perdidas >= Lectura.PERDIDAS_BUCLE) {
                        Log.w(Lectura.TAG, "el salvapantallas se quita: memoria de " + mb + " MB, la tarjeta gráfica perdida " + perdidas + " veces en 30 s");
                        caido();
                    } else h.postDelayed(vigilar, VIGILA_CADA);
                });
            }).start();
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= 28) {
            try {
                WebView.setDataDirectorySuffix("salvapantallas");
            } catch (IllegalStateException yaEstaba) {
            }
        }
    }

    @Override
    public void onAttachedToWindow() {
        super.onAttachedToWindow();
        setInteractive(false);
        setFullscreen(true);
        setScreenBright(true);
        web = new WebView(this);
        new Lectura(this).preparar(web, this::caido);
        setContentView(web);
    }

    private void caido() {
        h.removeCallbacks(vigilar);
        WebView viejo = web;
        web = null;
        if (viejo != null) {
            ViewGroup padre = (ViewGroup) viejo.getParent();
            if (padre != null) padre.removeView(viejo);
            viejo.destroy();
        }
        finish();
    }

    @Override
    public void onDreamingStarted() {
        super.onDreamingStarted();
        if (web == null) return;
        web.loadUrl("file:///android_asset/web/" + Lectura.pagina(new Lectura(this).diseno()) + ".html?salvapantallas=1");
        h.postDelayed(vigilar, VIGILA_CADA);
    }

    @Override
    public void onDreamingStopped() {
        h.removeCallbacks(vigilar);
        if (web != null) web.loadUrl("about:blank");
        super.onDreamingStopped();
    }

    @Override
    public void onDetachedFromWindow() {
        h.removeCallbacks(vigilar);
        if (web != null) web.destroy();
        web = null;
        super.onDetachedFromWindow();
    }

    @Override
    public void onDestroy() {
        h.removeCallbacksAndMessages(null);
        super.onDestroy();
        Process.killProcess(Process.myPid());
    }
}
