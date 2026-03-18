import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Professional } from "./professional.entity";

@Entity("professional_availability")
export class ProfessionalAvailability {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "professional_id", type: "uuid" })
  professionalId: string;

  @ManyToOne(() => Professional, { onDelete: "CASCADE" })
  @JoinColumn({ name: "professional_id" })
  professional: Professional;

  /** 0 = domingo … 6 = sábado */
  @Column({ type: "integer" })
  weekday: number;

  @Column({ name: "start_time", type: "time" })
  startTime: string;

  @Column({ name: "end_time", type: "time" })
  endTime: string;

  @Column({ type: "boolean", default: true })
  active: boolean;
}
