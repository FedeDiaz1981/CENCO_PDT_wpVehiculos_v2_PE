import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneHorizontalRule,
  PropertyPaneDropdown,
  PropertyPaneLabel,
  PropertyPaneToggle,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";

import RegistroVehicular from "./components/RegistroVehicular";
import { getSP, initSP } from "../../pnp";

// Props configurables desde el panel del webpart
export interface IRegistroVehicularWebPartProps {
  vehiculosListTitle: string;
  vehiculosViewModificacionId: string;
  vehiculosViewVisualizacionId: string;
  mostrarIngresar: boolean;
  mostrarModificar: boolean;
  mostrarVisualizar: boolean;
  mostrarBaja: boolean;
  proveedoresList: string;
  proveedoresDisplayField: string;
  proveedoresUserField: string;
  placaFormat: string;

  Proveedor: boolean;
  Distribuidor: boolean;
  Coordinador: boolean;
  Transportista: boolean;
  Borrar: boolean;

  alturaPisoHelpImageUrl: string;

  redireccion: boolean;
  urlRedireccion: string;
}

export default class RegistroVehicularWebPart extends BaseClientSideWebPart<IRegistroVehicularWebPartProps> {
  private _viewOptions: IPropertyPaneDropdownOption[] = [];
  private _viewsLoading = false;
  private _viewsLoadedForList = "";
  private _diagSiteUrl = "";
  private _diagViewSummary = "Sin diagnóstico todavía";
  private _diagViewError = "Sin errores";

  public render(): void {
    const vehiculosListTitle = this.properties.vehiculosListTitle || "Vehiculos";
    const componentProps: any = {
      spContext: this.context,

      vehiculosListTitle,
      vehiculosViewModificacionId:
        this.properties.vehiculosViewModificacionId || "",
      vehiculosViewVisualizacionId:
        this.properties.vehiculosViewVisualizacionId || "",
      mostrarIngresar: this.properties.mostrarIngresar ?? true,
      mostrarModificar: this.properties.mostrarModificar ?? true,
      mostrarVisualizar: this.properties.mostrarVisualizar ?? true,
      mostrarBaja: this.properties.mostrarBaja ?? true,
      proveedoresList: "Proveedores",
      proveedoresDisplayField: "Title",
      proveedoresUserField: "Usuarios",
      placaFormat: this.properties.placaFormat || "",

      Proveedor: this.properties.Proveedor ?? false,
      Distribuidor: false,
      Coordinador: false,
      Transportista: this.properties.Transportista ?? false,

      // pasa la config al componente React
      Borrar: this.properties.Borrar ?? false,

      alturaPisoHelpImageUrl: this.properties.alturaPisoHelpImageUrl || "",
      redireccion: this.properties.redireccion || false,
      urlRedireccion: this.properties.urlRedireccion || "", 
    };

    const element = React.createElement(
      RegistroVehicular as any,
      componentProps
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    initSP(this.context);
    return Promise.resolve();
  }

  protected onPropertyPaneConfigurationStart(): void {
    this._loadViewOptions(this.properties.vehiculosListTitle)
      .then(() => {
        this.context.propertyPane.refresh();
      })
      .catch((err) => console.error(err));
  }

  protected onPropertyPaneFieldChanged(
    propertyPath: string,
    oldValue: unknown,
    newValue: unknown
  ): void {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);

    if (propertyPath === "vehiculosListTitle" && oldValue !== newValue) {
      this._loadViewOptions(String(newValue || ""))
        .then(() => {
          this.context.propertyPane.refresh();
        })
        .catch((err) => console.error(err));
    }
  }

  private async _loadViewOptions(listTitle: string | undefined): Promise<void> {
    const normalizedListTitle = String(listTitle || "").trim();
    if (!normalizedListTitle) {
      this._viewOptions = [];
      this._viewsLoadedForList = "";
      return;
    }

    if (this._viewsLoading && this._viewsLoadedForList === normalizedListTitle) {
      return;
    }

    this._viewsLoading = true;
    try {
      const sp = getSP(this.context);
      this._diagSiteUrl = this.context.pageContext.web.absoluteUrl || "";
      const list = sp.web.lists.getByTitle(normalizedListTitle);
      const views = (await list.views.select(
        "Id",
        "Title",
        "DefaultView",
        "Hidden"
      )()) as Array<{
        Id?: string;
        Title?: string;
        DefaultView?: boolean;
        Hidden?: boolean;
      }>;

      const visible = views.filter(
        (v) => !v.Hidden && !!String(v.Title || "").trim() && !!String(v.Id || "").trim()
      );

      this._viewOptions = visible
        .map((l) => ({
          key: String(l.Id || ""),
          text: String(l.Title || ""),
        }))
        .sort((a, b) => a.text.localeCompare(b.text));
      this._viewsLoadedForList = normalizedListTitle;

      const defaultView =
        visible.find((v) => v.DefaultView) || visible[0] || undefined;
      const defaultViewId = defaultView ? String(defaultView.Id || "") : "";

      if (
        defaultViewId &&
        !visible.some(
          (v) => String(v.Id || "") === this.properties.vehiculosViewModificacionId
        )
      ) {
        this.properties.vehiculosViewModificacionId = defaultViewId;
      }

      if (
        defaultViewId &&
        !visible.some(
          (v) => String(v.Id || "") === this.properties.vehiculosViewVisualizacionId
        )
      ) {
        this.properties.vehiculosViewVisualizacionId = defaultViewId;
      }

      this._diagViewSummary = `Sitio: ${this._diagSiteUrl || "(sin URL)"} | Lista: ${normalizedListTitle} | Vistas visibles: ${visible.length}`;
      this._diagViewError = "Sin errores";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
      console.error("No se pudieron cargar las vistas de la lista", err);
      this._viewOptions = [];
      this._viewsLoadedForList = normalizedListTitle;
      this._diagSiteUrl = this.context.pageContext.web.absoluteUrl || "";
      this._diagViewSummary = `Sitio: ${this._diagSiteUrl || "(sin URL)"} | Lista: ${normalizedListTitle} | Vistas visibles: 0`;
      this._diagViewError = message || "Error desconocido";
    } finally {
      this._viewsLoading = false;
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  // Panel de propiedades (Property Pane)
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: "Configuración Registro Vehicular",
          },
          groups: [
            {
              groupName: "Roles / Permisos",
              groupFields: [
                PropertyPaneTextField("vehiculosListTitle", {
                  label: "Lista destino de vehículos",
                  placeholder: "Vehiculos",
                  description:
                    "Escribe el nombre exacto de la lista del sitio donde se guardan los vehículos.",
                }),
                PropertyPaneDropdown("vehiculosViewModificacionId", {
                  label: "Vista para modificación",
                  options: this._viewOptions,
                  selectedKey: this.properties.vehiculosViewModificacionId || "",
                  disabled: this._viewsLoading || !this._viewOptions.length,
                }),
                PropertyPaneDropdown("vehiculosViewVisualizacionId", {
                  label: "Vista para visualización",
                  options: this._viewOptions,
                  selectedKey: this.properties.vehiculosViewVisualizacionId || "",
                  disabled: this._viewsLoading || !this._viewOptions.length,
                }),
                PropertyPaneHorizontalRule(),
                PropertyPaneLabel("_diagSiteUrl", {
                  text: `Contexto: ${this._diagSiteUrl || "(sin URL)"}`,
                }),
                PropertyPaneLabel("_diagViewSummary", {
                  text: this._diagViewSummary,
                }),
                PropertyPaneLabel("_diagViewError", {
                  text: `Error: ${this._diagViewError || "Sin errores"}`,
                }),
                PropertyPaneToggle("Proveedor", {
                  label: "Proveedor",
                  onText: "Sí",
                  offText: "No",
                  checked: this.properties.Proveedor,
                }),
                PropertyPaneToggle("Transportista", {
                  label: "Transportista",
                  onText: "Sí",
                  offText: "No",
                  checked: this.properties.Transportista,
                }),
              ],
            },
            {
              groupName: "Acciones del formulario",
              groupFields: [
                PropertyPaneToggle("mostrarIngresar", {
                  label: "Mostrar ingresar",
                  onText: "Sí",
                  offText: "No",
                  checked: this.properties.mostrarIngresar ?? true,
                }),
                PropertyPaneToggle("mostrarModificar", {
                  label: "Mostrar modificar",
                  onText: "Sí",
                  offText: "No",
                  checked: this.properties.mostrarModificar ?? true,
                }),
                PropertyPaneToggle("mostrarVisualizar", {
                  label: "Mostrar visualizar",
                  onText: "Sí",
                  offText: "No",
                  checked: this.properties.mostrarVisualizar ?? true,
                }),
                PropertyPaneToggle("mostrarBaja", {
                  label: "Mostrar dar de baja",
                  onText: "Sí",
                  offText: "No",
                  checked: this.properties.mostrarBaja ?? true,
                }),
              ],
            },
            {
              groupName: "Comportamiento de baja",
              groupFields: [
                PropertyPaneToggle("Borrar", {
                  label:
                    "Al dar de baja, borrar registro (en vez de marcar inactivo)",
                  onText: "Borrar registro",
                  offText: "Marcar Activo = false",
                  checked: this.properties.Borrar,
                }),
              ],
            },
            {
              groupName: "Ayudas",
              groupFields: [
                PropertyPaneTextField("alturaPisoHelpImageUrl", {
                  label: "URL imagen ayuda (Altura de piso al furgón)",
                  placeholder: "https://.../Altura.png",
                }),
              ],
            },
            {
              groupName: "Validaciones",
              groupFields: [
                PropertyPaneTextField("placaFormat", {
                  label: "Formato de placa",
                  placeholder: "[3]-[3]",
                  description:
                    "Ejemplo: [3]-[3], [4]-[3]. El guion es opcional al cargar, pero se valida la cantidad maxima de caracteres.",
                }),
              ],
            },
            {
              groupName: "Comportamiento",
              groupFields: [
              PropertyPaneToggle("redireccion", {
                label: "Redirección",
                onText: "Activada",
                offText: "Desactivada",
              }),
              PropertyPaneTextField("urlRedireccion", {
                label: "URL de redirección",
                placeholder: "/sites/tuSitio/SitePages/Home.aspx",
                disabled: !this.properties.redireccion,
              }),
            ],
          },
          ],
        },
      ],
    };
  }
}
