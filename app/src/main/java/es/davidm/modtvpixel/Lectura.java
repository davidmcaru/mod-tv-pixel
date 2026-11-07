package es.davidm.modtvpixel;

/** Lectura — lo que las páginas piden a la tele (window.Android): las apps, sus carteles, la red, las entradas HDMI y lo guardado. */

import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Debug;
import android.os.Environment;
import android.os.storage.StorageManager;
import android.os.storage.StorageVolume;
import android.util.Log;
import android.util.LruCache;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Lectura {
    static final String TAG = "ModTVPixel";

    private static final LruCache<String, byte[]> DIBUJOS = new LruCache<String, byte[]>(8 * 1024 * 1024) {
        @Override
        protected int sizeOf(String k, byte[] v) {
            return v.length;
        }
    };

    final Context c;
    final SharedPreferences prefs;

    Lectura(Context c) {
        this.c = c;
        prefs = c.getSharedPreferences("modtvpixel", Context.MODE_PRIVATE);
    }

    static String pagina(String d) {
        return d != null && (d.equals("piratas") || d.equals("ninjas") || d.equals("magos")) ? d : "piratas";
    }

    static int memoriaMB() {
        Debug.MemoryInfo m = new Debug.MemoryInfo();
        Debug.getMemoryInfo(m);
        return m.getTotalPss() / 1024;
    }

    static final int PERDIDAS_BUCLE = 10;

    static int perdidasGrafica() {
        java.lang.Process logcat = null;
        try {
            logcat = new ProcessBuilder("logcat", "-d", "--pid=" + android.os.Process.myPid(), "-v", "epoch", "-t", "300", "chromium:E", "*:S")
                    .redirectErrorStream(true).start();
            BufferedReader r = new BufferedReader(new InputStreamReader(logcat.getInputStream()));
            double desde = System.currentTimeMillis() / 1000.0 - 30;
            int n = 0;
            for (String l; (l = r.readLine()) != null; ) {
                if (!l.contains("context lost via EXT_robustness")) continue;
                try {
                    if (Double.parseDouble(l.trim().split("\\s+", 2)[0]) >= desde) n++;
                } catch (NumberFormatException ignored) {
                }
            }
            return n;
        } catch (IOException e) {
            Log.w(TAG, "no puedo leer el registro: " + e);
            return 0;
        } finally {
            if (logcat != null) logcat.destroy();
        }
    }

    void preparar(WebView web, Runnable alCaer) {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setBackgroundColor(Color.BLACK);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setDefaultFocusHighlightEnabled(false);
        web.addJavascriptInterface(this, "Android");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (!"modtvpixel.local".equals(u.getHost()) || u.getPathSegments().size() != 2) return null;
                byte[] png = dibujo(u.getPathSegments().get(0), u.getPathSegments().get(1).replaceAll("\\.png$", ""));
                return png == null ? new WebResourceResponse("image/png", null, 404, "No hay", null, new ByteArrayInputStream(new byte[0]))
                        : new WebResourceResponse("image/png", null, new ByteArrayInputStream(png));
            }

            @Override
            public boolean onRenderProcessGone(WebView v, RenderProcessGoneDetail d) {
                Log.w(TAG, "el motor web se ha cerrado (" + (d.didCrash() ? "fallo" : "falta de memoria") + ")");
                alCaer.run();
                return true;
            }
        });
    }

    private byte[] dibujo(String tipo, String paquete) {
        String k = tipo + "/" + paquete;
        byte[] hecho = DIBUJOS.get(k);
        if (hecho != null) return hecho;
        try {
            PackageManager pm = c.getPackageManager();
            Bitmap b;
            if ("icono".equals(tipo)) {
                b = pintar(pm.getApplicationIcon(paquete), 144, 144, 0, 0, 144, Color.TRANSPARENT);
            } else {
                Intent i = pm.getLeanbackLaunchIntentForPackage(paquete);
                Drawable cartel = i != null ? pm.getActivityBanner(i) : pm.getApplicationBanner(paquete);
                b = cartel != null ? pintar(cartel, 320, 180, 0, 0, 320, Color.TRANSPARENT)
                        : pintar(pm.getApplicationIcon(paquete), 320, 180, 106, 36, 108, 0xFF23252F);
            }
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            b.compress(Bitmap.CompressFormat.PNG, 100, o);
            byte[] png = o.toByteArray();
            DIBUJOS.put(k, png);
            return png;
        } catch (Exception e) {
            return null;
        }
    }

    private static Bitmap pintar(Drawable d, int w, int h, int x, int y, int dw, int fondo) {
        Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas lienzo = new Canvas(b);
        lienzo.drawColor(fondo);
        d.setBounds(x, y, x + dw, y + (dw == w ? h : dw));
        d.draw(lienzo);
        return b;
    }

    @JavascriptInterface
    public String apps() {
        PackageManager pm = c.getPackageManager();
        List<ResolveInfo> l = pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER), 0);
        List<String[]> lista = new ArrayList<>();
        Set<String> vistas = new HashSet<>();
        for (ResolveInfo r : l) {
            String paquete = r.activityInfo.packageName;
            if (paquete.equals(c.getPackageName()) || !vistas.add(paquete)) continue;
            boolean cartel = r.activityInfo.banner != 0 || r.activityInfo.applicationInfo.banner != 0;
            lista.add(new String[] { r.loadLabel(pm).toString(), paquete, String.valueOf(cartel) });
        }
        lista.sort(Comparator.comparing(x -> x[0].toLowerCase()));
        JSONArray a = new JSONArray();
        for (String[] x : lista) {
            try {
                a.put(new JSONObject().put("paquete", x[1]).put("nombre", x[0]).put("cartel", Boolean.parseBoolean(x[2])));
            } catch (Exception ignored) {
            }
        }
        return a.toString();
    }

    @JavascriptInterface
    public String ultimas() {
        JSONObject o = new JSONObject();
        UsageStatsManager um = c.getSystemService(UsageStatsManager.class);
        if (um == null) return o.toString();
        long ahora = System.currentTimeMillis();
        try {
            for (Map.Entry<String, UsageStats> e : um.queryAndAggregateUsageStats(ahora - 31L * 24 * 3600 * 1000, ahora).entrySet()) {
                long t = e.getValue().getLastTimeVisible();
                if (t > 0) o.put(e.getKey(), t);
            }
        } catch (Exception ignored) {
        }
        return o.toString();
    }

    @JavascriptInterface
    public String orden(String clave) {
        return prefs.getString("orden." + clave, "");
    }

    @JavascriptInterface
    public void guardarOrden(String clave, String lista) {
        prefs.edit().putString("orden." + clave, lista).apply();
    }

    @JavascriptInterface
    public boolean pendrive() {
        StorageManager sm = c.getSystemService(StorageManager.class);
        if (sm == null) return false;
        for (StorageVolume v : sm.getStorageVolumes()) {
            if (v.isRemovable() && Environment.MEDIA_MOUNTED.equals(v.getState())) return true;
        }
        return false;
    }

    @JavascriptInterface
    public String diseno() {
        return prefs.getString("diseno", "piratas");
    }

    @JavascriptInterface
    public void guardarDiseno(String d) {
        prefs.edit().putString("diseno", d).apply();
    }

    @JavascriptInterface
    public String graficos() {
        return prefs.getString("graficos", "detallado");
    }

    @JavascriptInterface
    public void guardarGraficos(String g) {
        prefs.edit().putString("graficos", "basico".equals(g) ? "basico" : "detallado").apply();
    }

    @JavascriptInterface
    public String red() {
        ConnectivityManager cm = c.getSystemService(ConnectivityManager.class);
        NetworkCapabilities nc = cm == null ? null : cm.getNetworkCapabilities(cm.getActiveNetwork());
        if (nc == null) return "Sin red";
        if (nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) return "Cable";
        if (nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) return "Wi-Fi";
        return "Red";
    }
}
