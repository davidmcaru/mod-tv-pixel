package es.davidm.modtvpixel;

/** Inicio — la pantalla de inicio: un WebView a pantalla completa con las páginas de web/. */

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.media.tv.TvContract;
import android.media.tv.TvInputInfo;
import android.media.tv.TvInputManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Inicio extends Activity {
    private static final String TELE = "com.mediatek.wwtv.tvcenter";
    private static final int MEMORIA_MAX = 400;
    private static final int VIGIA_CADA = 10000;

    private WebView web;
    private Puente puente;
    private boolean parada = false;
    private final Handler h = new Handler(Looper.getMainLooper());
    private final Runnable vigia = new Runnable() {
        @Override
        public void run() {
            new Thread(() -> {
                int n = Lectura.perdidasGrafica();
                if (n >= Lectura.PERDIDAS_BUCLE) runOnUiThread(() -> reiniciar("la tarjeta gráfica se ha perdido " + n + " veces en 30 s"));
            }).start();
            h.postDelayed(this, VIGIA_CADA);
        }
    };

    private final BroadcastReceiver pendrive = new BroadcastReceiver() {
        @Override
        public void onReceive(Context c, Intent i) {
            llamar("alPendrive", String.valueOf(puente.pendrive()));
        }
    };
    private final BroadcastReceiver pantalla = new BroadcastReceiver() {
        @Override
        public void onReceive(Context c, Intent i) {
            llamar(Intent.ACTION_SCREEN_OFF.equals(i.getAction()) ? "alApagar" : "alEncender", "");
        }
    };

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        puente = new Puente();
        montar();

        IntentFilter f = new IntentFilter();
        f.addAction(Intent.ACTION_MEDIA_MOUNTED);
        f.addAction(Intent.ACTION_MEDIA_UNMOUNTED);
        f.addAction(Intent.ACTION_MEDIA_EJECT);
        f.addAction(Intent.ACTION_MEDIA_REMOVED);
        f.addAction(Intent.ACTION_MEDIA_BAD_REMOVAL);
        f.addDataScheme("file");
        registerReceiver(pendrive, f);
        IntentFilter p = new IntentFilter(Intent.ACTION_SCREEN_ON);
        p.addAction(Intent.ACTION_SCREEN_OFF);
        registerReceiver(pantalla, p);
    }

    private void montar() {
        web = new WebView(this);
        puente.preparar(web, () -> reiniciar("se ha cerrado el motor web"));
        setContentView(web);
        web.loadUrl("file:///android_asset/web/" + Lectura.pagina(puente.diseno()) + ".html?intro=1");
        web.requestFocus();
    }

    private void reiniciar(String porque) {
        Log.w(Lectura.TAG, "reinicio Mod TV Pixel: " + porque);
        android.os.Process.killProcess(android.os.Process.myPid());
    }

    private void comprobar() {
        new Thread(() -> {
            int mb = Lectura.memoriaMB();
            Log.i(Lectura.TAG, "memoria: " + mb + " MB");
            if (mb > MEMORIA_MAX) runOnUiThread(() -> reiniciar("memoria de " + mb + " MB"));
        }).start();
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        llamar("alInicio", "");
    }

    @Override
    protected void onStart() {
        super.onStart();
        h.removeCallbacks(vigia);
        h.postDelayed(vigia, VIGIA_CADA);
        if (!parada) return;
        parada = false;
        web.onResume();
        web.resumeTimers();
        comprobar();
    }

    @Override
    protected void onStop() {
        parada = true;
        h.removeCallbacks(vigia);
        web.onPause();
        web.pauseTimers();
        super.onStop();
    }

    @Override
    protected void onResume() {
        super.onResume();
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        llamar("alVolver", "");
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        if (e.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            if (e.getAction() == KeyEvent.ACTION_UP) llamar("alAtras", "");
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    @Override
    protected void onDestroy() {
        h.removeCallbacksAndMessages(null);
        unregisterReceiver(pendrive);
        unregisterReceiver(pantalla);
        if (web != null) web.destroy();
        web = null;
        super.onDestroy();
    }

    private void llamar(String funcion, String arg) {
        if (web == null) return;
        web.post(() -> { if (web != null) web.evaluateJavascript("typeof " + funcion + " === 'function' && " + funcion + "(" + arg + ")", null); });
    }

    private void aviso(String texto) {
        llamar("alAviso", JSONObject.quote(texto));
    }

    private void abrir(Intent i) {
        try {
            startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (ActivityNotFoundException | SecurityException e) {
            aviso("No se puede abrir");
        }
    }

    private void lanzar(String paquete) {
        PackageManager pm = getPackageManager();
        Intent i = pm.getLeanbackLaunchIntentForPackage(paquete);
        if (i == null) i = pm.getLaunchIntentForPackage(paquete);
        if (i == null) aviso("Esa app no está en la tele");
        else abrir(i);
    }

    private List<TvInputInfo> entradas() {
        List<TvInputInfo> l = new ArrayList<>();
        TvInputManager tim = getSystemService(TvInputManager.class);
        if (tim == null) return l;
        for (TvInputInfo t : tim.getTvInputList()) {
            if (t.isPassthroughInput() && !t.isHidden(this)) l.add(t);
        }
        l.sort(Comparator.comparing(TvInputInfo::getId));
        return l;
    }

    private String hdmi(int n) {
        List<TvInputInfo> todas = new ArrayList<>();
        for (TvInputInfo t : entradas()) {
            if (t.getType() == TvInputInfo.TYPE_HDMI) todas.add(t);
        }
        for (TvInputInfo t : todas) {
            CharSequence nombre = t.loadLabel(this);
            if (nombre != null && nombre.toString().replaceAll("\\D", "").equals(String.valueOf(n))) return t.getId();
        }
        return todas.size() >= n ? todas.get(n - 1).getId() : null;
    }

    private void verEntrada(String id) {
        Uri uri = TvContract.buildChannelUriForPassthroughInput(id);
        Intent ver = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, "vnd.android.cursor.item/channel");
        try {
            startActivity(new Intent(ver).setPackage(TELE).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return;
        } catch (ActivityNotFoundException | SecurityException ignored) {
        }
        abrir(ver);
    }

    private class Puente extends Lectura {
        Puente() {
            super(Inicio.this);
        }

        @JavascriptInterface
        public void abrir(String paquete) {
            runOnUiThread(() -> lanzar(paquete));
        }

        @JavascriptInterface
        public void hdmi(int n) {
            runOnUiThread(() -> {
                String id = Inicio.this.hdmi(n);
                if (id == null) aviso("No encuentro el HDMI " + n);
                else verEntrada(id);
            });
        }

        @JavascriptInterface
        public String entradas() {
            JSONArray a = new JSONArray();
            for (TvInputInfo t : Inicio.this.entradas()) {
                try {
                    a.put(new JSONObject().put("id", t.getId()).put("nombre", String.valueOf(t.loadLabel(Inicio.this))).put("tipo", t.getType()));
                } catch (Exception ignored) {
                }
            }
            return a.toString();
        }

        @JavascriptInterface
        public void entrada(String id) {
            runOnUiThread(() -> verEntrada(id));
        }

        @JavascriptInterface
        public void ajustes() {
            runOnUiThread(() -> Inicio.this.abrir(new Intent(Settings.ACTION_SETTINGS)));
        }

        @JavascriptInterface
        public void ajustesRed() {
            runOnUiThread(() -> Inicio.this.abrir(new Intent(Settings.ACTION_WIFI_SETTINGS)));
        }

        @JavascriptInterface
        public void info(String paquete) {
            runOnUiThread(() -> Inicio.this.abrir(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + paquete))));
        }
    }
}
