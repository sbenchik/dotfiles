#include <glib/gprintf.h>  
#include <i3ipc-glib/i3ipc-glib.h>  
/* compile with: gcc -o i3ipc_hideshow_border i3ipc_hideshow_border.c $(pkg-config --libs --cflags i3ipc-glib-1.0) */  

gint main() {  
  i3ipcConnection *conn = i3ipc_connection_new(NULL, NULL);  

  i3ipcCon *root = i3ipc_connection_get_tree(conn, NULL);  
  i3ipcCon *focused = i3ipc_con_find_focused(root);  

  gchar *focused_border = NULL;  
  g_object_get(focused, "border", &focused_border, NULL);  

  if (!g_strcmp0(focused_border,"none"))  
    {  
      /* None (tiled) -> need to add normal borders. */  
      i3ipc_con_command(focused, "border normal", NULL);  
    }  
  else if(!g_strcmp0(focused_border,"normal"))  
    {  
      /* Normal (floating) -> need to remove borders. */  
      i3ipc_con_command(focused, "border none", NULL);  
    }  

  g_object_unref(root);  
  g_object_unref(focused);  
  g_object_unref(conn);  

  return 0;  
}  
