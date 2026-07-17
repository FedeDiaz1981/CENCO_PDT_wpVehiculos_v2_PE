import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
  PropertyPaneToggle,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";

import RegistroVehicular from "./components/RegistroVehicular";
import { SP, initSP } from "../../pnp";

// Props configurables desde el panel del webpart
export interface IRegistroVehicularWebPartProps {
  vehiculosListTitle: string;
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
  private _listOptions: IPropertyPaneDropdownOption[] = [];
  private _listsLoading = false;

  public render(): void {
    const vehiculosListTitle = this.properties.vehiculosListTitle || "Vehiculos";
    const componentProps: any = {
      spContext: this.context,

      vehiculosListTitle,
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
    void this._loadListOptions().then(() => {
      this.context.propertyPane.refresh();
    });
  }

  private async _loadListOptions(): Promise<void> {
    if (this._listsLoading) return;
    this._listsLoading = true;
    try {
      const options = await SP().web.lists.select("Title,Hidden,BaseTemplate")();
      const filtered = (options as Array<{
        Title?: string;
        Hidden?: boolean;
        BaseTemplate?: number;
      }>).filter(
        (l) =>
          !l.Hidden &&
          l.BaseTemplate === 100 &&
          !!String(l.Title || "").trim()
      );

      this._listOptions = filtered
        .map((l) => ({
          key: String(l.Title || ""),
          text: String(l.Title || ""),
        }))
        .sort((a, b) => a.text.localeCompare(b.text));
    } catch (err) {
      console.error("No se pudieron cargar las listas del sitio", err);
      this._listOptions = [];
    } finally {
      this._listsLoading = false;
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
                PropertyPaneDropdown("vehiculosListTitle", {
                  label: "Lista destino de vehículos",
                  options: this._listOptions,
                  selectedKey:
                    this.properties.vehiculosListTitle || "Vehiculos",
                  disabled: this._listsLoading,
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
